from __future__ import annotations

import asyncio
import datetime
import json
import logging
import os
import ssl
import threading
import time
import uuid
from typing import Any, Callable, Coroutine, Dict, Optional, Tuple

from dotenv import load_dotenv
import paho.mqtt.client as mqtt

from backend.database import get_db, log_audit

LOG = logging.getLogger("uvicorn.error")

TELEMETRY_FEEDS = {
    "smartfarm-temp": "TEMP",
    "smartfarm-humi": "HUMI",
    "smartfarm-soil": "SOIL",
    "smartfarm-light": "LIGHT",
}
ACTUATOR_FEEDS = {
    "smartfarm-pump": "PUMP",
    "smartfarm-led": "LED",
}
METRIC_TO_ACTUATOR_FEED = {v: k for k, v in ACTUATOR_FEEDS.items()}


class BackendMqttBridge:
    """Bidirectional Adafruit IO <-> SQLite bridge for Zone 1 hardware devices."""

    def __init__(self, echo_guard_sec: float = 2.0) -> None:
        self._echo_guard_sec = echo_guard_sec
        self._client: Optional[mqtt.Client] = None
        self._connected = threading.Event()
        self._lock = threading.Lock()
        self._username: str = ""
        self._enabled: bool = False
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._on_telemetry: Optional[Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]] = None
        # Tracks commands published by this backend: metric -> (action, monotonic_ts)
        self._last_published: Dict[str, Tuple[str, float]] = {}

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    @property
    def is_connected(self) -> bool:
        return self._connected.is_set()

    def start(
        self,
        loop: Optional[asyncio.AbstractEventLoop] = None,
        on_telemetry: Optional[Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]] = None,
    ) -> None:
        if os.getenv("PYTEST_CURRENT_TEST"):
            return
        self._loop = loop
        self._on_telemetry = on_telemetry
        load_dotenv()
        enabled_raw = os.getenv("MQTT_ENABLED", "false").strip().lower()
        if enabled_raw not in {"1", "true", "yes", "on"}:
            self._enabled = False
            LOG.info("Backend MQTT Bridge disabled (set MQTT_ENABLED=true in .env to enable)")
            return

        username = os.getenv("AIO_USERNAME", "").strip()
        aio_key = os.getenv("AIO_KEY", "").strip()
        if not username or not aio_key:
            self._enabled = False
            LOG.warning("MQTT_ENABLED=true but AIO_USERNAME/AIO_KEY missing; skipping MQTT connect")
            return

        host = os.getenv("MQTT_HOST", "io.adafruit.com").strip()
        port = int(os.getenv("MQTT_PORT", "8883"))

        self._username = username
        self._enabled = True
        client_id = f"sf-backend-{uuid.uuid4().hex[:8]}"

        client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=client_id,
            protocol=mqtt.MQTTv311,
        )
        client.username_pw_set(username, aio_key)
        if port == 8883:
            client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
        client.reconnect_delay_set(min_delay=2, max_delay=60)
        client.on_connect = self._on_connect
        client.on_disconnect = self._on_disconnect
        client.on_message = self._on_message

        self._client = client
        client.connect_async(host, port, keepalive=60)
        client.loop_start()
        LOG.info("Backend MQTT Bridge starting (%s:%s as %s)", host, port, client_id)

    def stop(self) -> None:
        if self._client is not None:
            self._client.loop_stop()
            self._client.disconnect()
            self._client = None
        self._connected.clear()
        self._enabled = False
        self._loop = None
        self._on_telemetry = None

    def _feed_topic(self, feed_key: str) -> str:
        return f"{self._username}/feeds/{feed_key}"

    def _on_connect(self, client, userdata, flags, reason_code, properties) -> None:
        if reason_code == 0:
            self._connected.set()
            LOG.info("Backend MQTT Bridge connected to Adafruit IO")
            for feed_key in list(TELEMETRY_FEEDS.keys()) + list(ACTUATOR_FEEDS.keys()):
                client.subscribe(self._feed_topic(feed_key), qos=1)
            client.subscribe(f"{self._username}/throttle", qos=0)
            client.subscribe(f"{self._username}/errors", qos=0)
        else:
            LOG.error("Backend MQTT connect failed: reason_code=%s", reason_code)

    def _on_disconnect(self, client, userdata, disconnect_flags, reason_code, properties) -> None:
        self._connected.clear()
        LOG.warning("Backend MQTT Bridge disconnected: reason_code=%s", reason_code)

    def _on_message(self, client, userdata, msg: mqtt.MQTTMessage) -> None:
        topic = msg.topic
        payload = msg.payload.decode("utf-8", errors="ignore").strip()

        if topic.endswith("/throttle"):
            LOG.warning("[Adafruit IO THROTTLE] %s", payload)
            return
        if topic.endswith("/errors"):
            LOG.error("[Adafruit IO ERROR] %s", payload)
            return

        feed_key = topic.rsplit("/", 1)[-1]
        if feed_key in TELEMETRY_FEEDS:
            self.ingest_telemetry(TELEMETRY_FEEDS[feed_key], payload)
        elif feed_key in ACTUATOR_FEEDS:
            self.ingest_actuator_state(ACTUATOR_FEEDS[feed_key], payload)

    def _find_hardware_device(self, conn, metric: str, device_type: str):
        """Find the Zone 1 non-simulated device (is_simulated = 0) matching metric."""
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT d.id, d.name, d.zone_id, d.metrics_json,
                   z.name AS zone_name, z.farm_id AS farm_id, f.name AS farm_name
            FROM devices d
            LEFT JOIN zones z ON d.zone_id = z.id
            LEFT JOIN farms f ON z.farm_id = f.id
            WHERE d.type = ? AND d.is_simulated = 0
            ORDER BY d.id ASC
            """,
            (device_type,),
        )
        for row in cursor.fetchall():
            metrics = json.loads(row["metrics_json"])
            if metric in metrics:
                return row
        return None

    def _evaluate_threshold_alert(
        self, conn, farm_id: Optional[int], zone_id: int, device_id: int, metric: str, value: float, now_iso: str
    ) -> None:
        """FR-BE-02: Create an alert when real sensor telemetry breaches warning/danger bounds."""
        if not farm_id:
            return
        thresh = conn.execute(
            "SELECT warning_min, warning_max, danger_min, danger_max FROM thresholds WHERE zone_id = ? AND metric = ?",
            (zone_id, metric),
        ).fetchone()
        if not thresh:
            return

        severity = None
        if value < thresh["danger_min"] or value > thresh["danger_max"]:
            severity = "CRITICAL"
        elif value < thresh["warning_min"] or value > thresh["warning_max"]:
            severity = "WARNING"
        if not severity:
            return

        existing = conn.execute(
            """
            SELECT id FROM alerts
            WHERE zone_id = ? AND metric = ? AND severity = ? AND status = 'UNACKNOWLEDGED'
            LIMIT 1
            """,
            (zone_id, metric, severity),
        ).fetchone()
        if existing:
            return

        msg = f"Chỉ số {metric} vượt ngưỡng ({value}) tại Zone {zone_id}"
        conn.execute(
            """
            INSERT INTO alerts (farm_id, zone_id, device_id, metric, severity, message, status, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'UNACKNOWLEDGED', NULL, ?)
            """,
            (farm_id, zone_id, device_id, metric, severity, msg, now_iso),
        )

    def ingest_telemetry(self, metric: str, raw_payload: str) -> bool:
        try:
            value = float(raw_payload)
        except ValueError:
            LOG.warning("Ignoring non-numeric telemetry %s=%s", metric, raw_payload)
            return False

        conn = get_db()
        try:
            dev = self._find_hardware_device(conn, metric, "SENSOR")
            if not dev:
                return False
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            conn.execute(
                "INSERT INTO telemetry (zone_id, device_id, metric, value, recorded_at) VALUES (?, ?, ?, ?, ?)",
                (dev["zone_id"], dev["id"], metric, value, now_iso),
            )
            conn.execute("UPDATE devices SET status = 'ONLINE' WHERE id = ?", (dev["id"],))
            self._evaluate_threshold_alert(conn, dev["farm_id"], dev["zone_id"], dev["id"], metric, value, now_iso)
            conn.commit()
            LOG.info("[MQTT -> DB] Telemetry %s=%s (zone=%s)", metric, value, dev["zone_id"])
        finally:
            conn.close()

        if self._loop is not None and self._on_telemetry is not None:
            packet = {
                "event": "telemetry",
                "data": {
                    "zone_id": dev["zone_id"],
                    "device_id": dev["id"],
                    "metric": metric,
                    "value": value,
                    "timestamp": now_iso,
                },
            }
            try:
                asyncio.run_coroutine_threadsafe(self._on_telemetry(packet), self._loop)
            except Exception as exc:
                LOG.debug("SSE broadcast skipped: %s", exc)
        return True

    def ingest_actuator_state(
        self, metric: str, raw_payload: str, now: Optional[float] = None
    ) -> bool:
        if raw_payload not in {"0", "1"}:
            LOG.warning("Ignoring invalid actuator payload %s=%s", metric, raw_payload)
            return False

        new_state = "ON" if raw_payload == "1" else "OFF"
        ts = time.monotonic() if now is None else now

        with self._lock:
            last = self._last_published.get(metric)
            if last and last[0] == new_state and (ts - last[1]) < self._echo_guard_sec:
                LOG.debug("Suppressed backend self-echo for %s=%s", metric, new_state)
                return False

        conn = get_db()
        try:
            dev = self._find_hardware_device(conn, metric, "ACTUATOR")
            if not dev:
                return False

            cur = conn.execute(
                "SELECT state FROM actuator_states WHERE device_id = ?",
                (dev["id"],),
            )
            row = cur.fetchone()
            if row and row["state"] == new_state:
                return False

            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            conn.execute(
                "UPDATE actuator_states SET state = ?, mode = 'MANUAL', last_action_at = ? WHERE device_id = ?",
                (new_state, now_iso, dev["id"]),
            )
            conn.execute("UPDATE devices SET status = 'ONLINE' WHERE id = ?", (dev["id"],))
            conn.commit()
        finally:
            conn.close()

        log_audit(
            user_id=None,
            user_name="Thiết bị hiện trường (MQTT)",
            role="SYSTEM",
            event_type="DEVICE_CONTROL",
            action=f"Đồng bộ {dev['name']}: {new_state}",
            details=f"Trạng thái đổi sang {new_state} từ thiết bị thật / Broker",
            farm_name=dev["farm_name"],
            zone_name=dev["zone_name"],
            device_name=dev["name"],
        )
        LOG.info("[MQTT -> DB] Actuator synced: %s=%s", metric, new_state)
        return True

    def publish_actuator_command(
        self, metric: str, action: str, now: Optional[float] = None
    ) -> bool:
        """Called by POST /api/v1/devices/{device_id}/control to push command to Broker."""
        norm_metric = metric.upper()
        norm_action = action.upper()
        feed_key = METRIC_TO_ACTUATOR_FEED.get(norm_metric)
        if not feed_key or norm_action not in {"ON", "OFF"}:
            return False
        if not self._enabled or self._client is None or not self.is_connected:
            return False

        ts = time.monotonic() if now is None else now
        with self._lock:
            self._last_published[norm_metric] = (norm_action, ts)

        payload = "1" if norm_action == "ON" else "0"
        info = self._client.publish(self._feed_topic(feed_key), payload, qos=1)
        ok = info.rc == mqtt.MQTT_ERR_SUCCESS
        if ok:
            LOG.info("[API -> MQTT] Published %s=%s to %s", norm_metric, payload, feed_key)
        return ok


mqtt_bridge = BackendMqttBridge()