from __future__ import annotations

import logging
import os
import signal
import sys
import threading
import time
from typing import Dict, Optional

from dotenv import load_dotenv

from gateway.adafruit_adapter import AdafruitIOAdapter
from gateway.offline_queue import OfflineTelemetryQueue
from gateway.serial_transport import MockSerialTransport, PySerialTransport, SerialTransport
from gateway.uart_codec import UartPacket, UartStreamDecoder, format_actuator_frame

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
LOG = logging.getLogger("gateway.main")


class SmartFarmGateway:
    def __init__(
        self,
        transport: SerialTransport,
        broker,
        offline_queue: OfflineTelemetryQueue,
        zone_id: int = 1,
        telemetry_interval_sec: float = 15.0,
        echo_guard_sec: float = 1.5,
        max_offline_actuator_sec: float = 900.0,
    ) -> None:
        self.transport = transport
        self.broker = broker
        self.offline_queue = offline_queue
        self.zone_id = zone_id
        self.telemetry_interval_sec = telemetry_interval_sec
        self.echo_guard_sec = echo_guard_sec
        self.max_offline_actuator_sec = max_offline_actuator_sec

        self._decoder = UartStreamDecoder()
        self._lock = threading.Lock()
        self._running = False

        # Anti-echo-loop & safety state
        self._actuator_state: Dict[str, str] = {}
        self._last_mqtt_pub: Dict[str, float] = {}
        self._actuator_on_since: Dict[str, float] = {}

        # Sensor throttling (keeps Adafruit IO < 30 pts/min)
        self._last_sensor_pub: Dict[str, float] = {}
        self._last_drain_ts: float = 0.0

    def handle_mqtt_command(self, actuator_key: str, state: str, now: Optional[float] = None) -> bool:
        """Downlink: Broker -> UART. Returns True if forwarded to MCU."""
        ts = time.monotonic() if now is None else now
        with self._lock:
            # Drop self-echo from single bidirectional Adafruit IO feed
            if (
                self._actuator_state.get(actuator_key) == state
                and (ts - self._last_mqtt_pub.get(actuator_key, 0.0)) < self.echo_guard_sec
            ):
                LOG.debug("Suppressed MQTT self-echo for %s=%s", actuator_key, state)
                return False

            if self._actuator_state.get(actuator_key) == state:
                return False

            frame = format_actuator_frame(self.zone_id, actuator_key, state)
            self.transport.write_frame(frame)
            self._actuator_state[actuator_key] = state
            if state == "ON":
                self._actuator_on_since[actuator_key] = ts
            else:
                self._actuator_on_since.pop(actuator_key, None)
            LOG.info("[Broker -> UART] Forwarded %s", frame)
            return True

    def handle_uart_packet(self, pkt: UartPacket, now: Optional[float] = None) -> None:
        """Uplink: UART -> Broker (or offline queue)."""
        ts = time.monotonic() if now is None else now

        if pkt.kind == "SENSOR":
            last_sent = self._last_sensor_pub.get(pkt.key, -1e9)
            if (ts - last_sent) < self.telemetry_interval_sec:
                return
            self._last_sensor_pub[pkt.key] = ts
            val = float(pkt.value)
            if self.broker.publish_telemetry(pkt.key, val):
                LOG.info("[UART -> Broker] %s=%s", pkt.key, val)
            else:
                self.offline_queue.push(pkt.key, val)
                LOG.warning(
                    "[Offline Queue] Buffered %s=%s (queued=%d)",
                    pkt.key,
                    val,
                    self.offline_queue.count(),
                )
            return

        # Actuator state reported from physical button/IR or MCU ACK
        state = str(pkt.value)
        with self._lock:
            if self._actuator_state.get(pkt.key) == state:
                # Matches state already set by MQTT command -> ACK confirmed, do not re-publish
                LOG.debug("ACK confirmed from UART for %s=%s (no re-publish)", pkt.key, state)
                return

            self._actuator_state[pkt.key] = state
            if state == "ON":
                self._actuator_on_since[pkt.key] = ts
            else:
                self._actuator_on_since.pop(pkt.key, None)
            self._last_mqtt_pub[pkt.key] = ts

        if self.broker.publish_actuator_state(pkt.key, state):
            LOG.info("[UART -> Broker] Physical toggle synced: %s=%s", pkt.key, state)
        else:
            LOG.warning("Broker offline; could not sync physical toggle %s=%s", pkt.key, state)

    def check_safety_shutoff(self, now: Optional[float] = None) -> list[str]:
        """FR-GW-04: Auto-shutoff actuators if broker is offline past max duration."""
        if self.broker.is_connected:
            return []
        ts = time.monotonic() if now is None else now
        shutoff_frames: list[str] = []
        with self._lock:
            for key, started_at in list(self._actuator_on_since.items()):
                if (ts - started_at) >= self.max_offline_actuator_sec:
                    frame = format_actuator_frame(self.zone_id, key, "OFF")
                    self.transport.write_frame(frame)
                    self._actuator_state[key] = "OFF"
                    self._actuator_on_since.pop(key, None)
                    shutoff_frames.append(frame)
                    LOG.warning("[SAFETY SHUTOFF] Sent %s (offline timeout)", frame)
        return shutoff_frames

    def drain_offline_queue(self, now: Optional[float] = None) -> int:
        """Drain buffered readings gently (1 every 3s) so Adafruit IO does not throttle."""
        if not self.broker.is_connected:
            return 0
        ts = time.monotonic() if now is None else now
        if (ts - self._last_drain_ts) < 3.0:
            return 0
        batch = self.offline_queue.peek_batch(limit=1)
        if not batch:
            return 0
        row_id, metric, value = batch[0]
        if self.broker.publish_telemetry(metric, value):
            self.offline_queue.delete_ids([row_id])
            self._last_drain_ts = ts
            LOG.info("[Queue Drain] Published %s=%s (remaining=%d)", metric, value, self.offline_queue.count())
            return 1
        return 0

    def step_once(self) -> None:
        chunk = self.transport.read_chunk()
        if chunk:
            for pkt in self._decoder.feed(chunk):
                self.handle_uart_packet(pkt)
        self.drain_offline_queue()
        self.check_safety_shutoff()

    def run_forever(self) -> None:
        self._running = True
        self.broker.connect()
        LOG.info("SmartFarmGateway started (interval=%.1fs)", self.telemetry_interval_sec)
        try:
            while self._running:
                self.step_once()
        finally:
            self.broker.disconnect()
            self.transport.close()
            self.offline_queue.close()
            LOG.info("SmartFarmGateway stopped cleanly")

    def stop(self) -> None:
        self._running = False


def build_gateway_from_env() -> SmartFarmGateway:
    load_dotenv()
    username = os.getenv("AIO_USERNAME", "").strip()
    aio_key = os.getenv("AIO_KEY", "").strip()
    if not username or not aio_key:
        raise RuntimeError("Missing AIO_USERNAME or AIO_KEY in .env")

    port = os.getenv("SERIAL_PORT", "MOCK").strip()
    baudrate = int(os.getenv("SERIAL_BAUDRATE", "115200"))
    interval = float(os.getenv("TELEMETRY_INTERVAL_SEC", "15"))

    transport: SerialTransport = (
        MockSerialTransport()
        if port.upper() == "MOCK"
        else PySerialTransport(port=port, baudrate=baudrate)
    )

    queue_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gateway_offline.db")
    offline_queue = OfflineTelemetryQueue(db_path=queue_path)

    gw_ref: list[SmartFarmGateway] = []
    broker = AdafruitIOAdapter(
        username=username,
        aio_key=aio_key,
        on_actuator_command=lambda k, s: gw_ref[0].handle_mqtt_command(k, s),
    )
    gw = SmartFarmGateway(
        transport=transport,
        broker=broker,
        offline_queue=offline_queue,
        telemetry_interval_sec=interval,
    )
    gw_ref.append(gw)
    return gw


def main() -> None:
    gw = build_gateway_from_env()

    def _sig_handler(signum, frame) -> None:
        gw.stop()

    signal.signal(signal.SIGINT, _sig_handler)
    signal.signal(signal.SIGTERM, _sig_handler)
    gw.run_forever()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        LOG.error("Fatal error: %s", exc)
        sys.exit(1)