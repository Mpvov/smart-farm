from __future__ import annotations

import logging
import ssl
import threading
import uuid
from typing import Callable, Optional

import paho.mqtt.client as mqtt

LOG = logging.getLogger("gateway.mqtt")

TELEMETRY_FEEDS = {
    "TEMP": "smartfarm-temp",
    "HUMI": "smartfarm-humi",
    "SOIL": "smartfarm-soil",
}
ACTUATOR_FEEDS = {
    "PUMP": "smartfarm-pump",
    "LED": "smartfarm-led",
}
FEED_TO_ACTUATOR = {v: k for k, v in ACTUATOR_FEEDS.items()}


class AdafruitIOAdapter:
    """MQTT Broker adapter for Adafruit IO per contracts/mqtt.md."""

    def __init__(
        self,
        username: str,
        aio_key: str,
        on_actuator_command: Callable[[str, str], None],
        host: str = "io.adafruit.com",
        port: int = 8883,
    ) -> None:
        self._username = username
        self._host = host
        self._port = port
        self._on_actuator_command = on_actuator_command
        self._connected = threading.Event()

        client_id = f"sf-gateway-{uuid.uuid4().hex[:8]}"
        self._client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=client_id,
            protocol=mqtt.MQTTv311,
        )
        self._client.username_pw_set(username, aio_key)
        if port == 8883:
            self._client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
        self._client.reconnect_delay_set(min_delay=2, max_delay=60)

        self._client.on_connect = self._handle_connect
        self._client.on_disconnect = self._handle_disconnect
        self._client.on_message = self._handle_message

    @property
    def is_connected(self) -> bool:
        return self._connected.is_set()

    def connect(self) -> None:
        self._client.connect_async(self._host, self._port, keepalive=60)
        self._client.loop_start()

    def disconnect(self) -> None:
        self._client.loop_stop()
        self._client.disconnect()
        self._connected.clear()

    def _feed_topic(self, feed_key: str) -> str:
        return f"{self._username}/feeds/{feed_key}"

    def _handle_connect(self, client, userdata, flags, reason_code, properties) -> None:
        if reason_code == 0:
            self._connected.set()
            LOG.info("Connected to Adafruit IO (%s:%s)", self._host, self._port)
            for feed_key in ACTUATOR_FEEDS.values():
                client.subscribe(self._feed_topic(feed_key), qos=1)
            client.subscribe(f"{self._username}/throttle", qos=0)
            client.subscribe(f"{self._username}/errors", qos=0)
        else:
            LOG.error("MQTT connection failed: reason_code=%s", reason_code)

    def _handle_disconnect(self, client, userdata, disconnect_flags, reason_code, properties) -> None:
        self._connected.clear()
        LOG.warning("Disconnected from Adafruit IO: reason_code=%s", reason_code)

    def _handle_message(self, client, userdata, msg: mqtt.MQTTMessage) -> None:
        topic = msg.topic
        payload = msg.payload.decode("utf-8", errors="ignore").strip()

        if topic.endswith("/throttle"):
            LOG.warning("[Adafruit IO THROTTLE] %s", payload)
            return
        if topic.endswith("/errors"):
            LOG.error("[Adafruit IO ERROR] %s", payload)
            return

        feed_key = topic.rsplit("/", 1)[-1]
        actuator_key = FEED_TO_ACTUATOR.get(feed_key)
        if not actuator_key:
            return
        if payload not in {"0", "1"}:
            LOG.warning("Ignoring invalid command payload '%s' on %s", payload, feed_key)
            return

        state = "ON" if payload == "1" else "OFF"
        self._on_actuator_command(actuator_key, state)

    def publish_telemetry(self, metric: str, value: float) -> bool:
        feed_key = TELEMETRY_FEEDS.get(metric.upper())
        if not feed_key or not self.is_connected:
            return False
        info = self._client.publish(self._feed_topic(feed_key), str(value), qos=1)
        return info.rc == mqtt.MQTT_ERR_SUCCESS

    def publish_actuator_state(self, actuator_key: str, state: str) -> bool:
        feed_key = ACTUATOR_FEEDS.get(actuator_key.upper())
        if not feed_key or not self.is_connected:
            return False
        payload = "1" if state.upper() == "ON" else "0"
        info = self._client.publish(self._feed_topic(feed_key), payload, qos=1)
        return info.rc == mqtt.MQTT_ERR_SUCCESS