from __future__ import annotations

from typing import List, Tuple

from gateway.main import SmartFarmGateway
from gateway.offline_queue import OfflineTelemetryQueue
from gateway.uart_codec import UartStreamDecoder, format_actuator_frame, parse_frame


class FakeTransport:
    def __init__(self) -> None:
        self.written: List[str] = []

    def read_chunk(self) -> str:
        return ""

    def write_frame(self, frame: str) -> None:
        self.written.append(frame)

    def close(self) -> None:
        pass


class FakeBroker:
    def __init__(self, connected: bool = True) -> None:
        self.is_connected = connected
        self.telemetry: List[Tuple[str, float]] = []
        self.actuators: List[Tuple[str, str]] = []

    def connect(self) -> None:
        pass

    def disconnect(self) -> None:
        pass

    def publish_telemetry(self, metric: str, value: float) -> bool:
        if not self.is_connected:
            return False
        self.telemetry.append((metric, value))
        return True

    def publish_actuator_state(self, actuator_key: str, state: str) -> bool:
        if not self.is_connected:
            return False
        self.actuators.append((actuator_key, state))
        return True


def test_uart_stream_decoder_handles_fragments_noise_and_outliers():
    dec = UartStreamDecoder()
    assert dec.feed("junk!1:TE") == []
    pkts = dec.feed("MP:28.5#!1:SOIL:999#!1:HUMI:65#!1:LIGHT:80#!1:PUMP:ON#")
    assert len(pkts) == 4  # SOIL:999 rejected as outlier
    assert (pkts[0].key, pkts[0].value) == ("TEMP", 28.5)
    assert (pkts[1].key, pkts[1].value) == ("HUMI", 65.0)
    assert (pkts[2].key, pkts[2].value) == ("LIGHT", 80.0)
    assert (pkts[3].key, pkts[3].value) == ("PUMP", "ON")


def test_anti_echo_loop_physical_toggle_does_not_retrigger_uart(tmp_path):
    transport = FakeTransport()
    broker = FakeBroker(connected=True)
    q = OfflineTelemetryQueue(db_path=str(tmp_path / "q.db"))
    gw = SmartFarmGateway(transport, broker, q)

    pkt = parse_frame("!1:PUMP:ON#")
    assert pkt is not None
    gw.handle_uart_packet(pkt, now=100.0)
    assert broker.actuators == [("PUMP", "ON")]

    # Adafruit IO echoes "1" back onto the same feed right after publish
    forwarded = gw.handle_mqtt_command("PUMP", "ON", now=100.3)
    assert forwarded is False
    assert transport.written == []
    q.close()


def test_anti_echo_loop_mqtt_command_does_not_republish_on_uart_ack(tmp_path):
    transport = FakeTransport()
    broker = FakeBroker(connected=True)
    q = OfflineTelemetryQueue(db_path=str(tmp_path / "q.db"))
    gw = SmartFarmGateway(transport, broker, q)

    forwarded = gw.handle_mqtt_command("LED", "ON", now=200.0)
    assert forwarded is True
    assert transport.written == [format_actuator_frame(1, "LED", "ON")]

    # Yolo:Bit executes and echoes !1:LED:ON# back on UART
    ack = parse_frame("!1:LED:ON#")
    assert ack is not None
    gw.handle_uart_packet(ack, now=200.1)
    assert broker.actuators == []
    q.close()


def test_offline_queue_buffers_over_1000_records_and_drains(tmp_path):
    q = OfflineTelemetryQueue(db_path=str(tmp_path / "q.db"), max_rows=1500)
    for i in range(1100):
        q.push("TEMP", 25.0 + (i % 10) * 0.1)
    assert q.count() == 1100

    transport = FakeTransport()
    broker = FakeBroker(connected=True)
    gw = SmartFarmGateway(transport, broker, q)
    assert gw.drain_offline_queue(now=10.0) == 1
    assert q.count() == 1099
    assert len(broker.telemetry) == 1
    q.close()


def test_edge_safety_shutoff_when_offline_timeout_exceeded(tmp_path):
    transport = FakeTransport()
    broker = FakeBroker(connected=True)
    q = OfflineTelemetryQueue(db_path=str(tmp_path / "q.db"))
    gw = SmartFarmGateway(transport, broker, q, max_offline_actuator_sec=60.0)

    gw.handle_mqtt_command("PUMP", "ON", now=10.0)
    broker.is_connected = False
    assert gw.check_safety_shutoff(now=50.0) == []

    frames = gw.check_safety_shutoff(now=75.0)
    assert frames == ["!1:PUMP:OFF#"]
    assert transport.written[-1] == "!1:PUMP:OFF#"
    q.close()