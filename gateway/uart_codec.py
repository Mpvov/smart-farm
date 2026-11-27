from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

SENSOR_RANGES: dict[str, Tuple[float, float]] = {
    "TEMP": (-10.0, 60.0),
    "HUMI": (0.0, 100.0),
    "SOIL": (0.0, 100.0),
    "LIGHT": (0.0, 100000.0),
}
ACTUATOR_KEYS = {"PUMP", "LED"}

_SENSOR_RE = re.compile(r"^!(\d+):(TEMP|HUMI|SOIL|LIGHT):(-?[0-9]+(?:\.[0-9]+)?)#$")
_ACTUATOR_RE = re.compile(r"^!(\d+):(PUMP|LED):(ON|OFF)#$")


@dataclass(frozen=True)
class UartPacket:
    zone_id: int
    key: str
    value: float | str
    kind: str  # "SENSOR" or "ACTUATOR"


def parse_frame(frame: str) -> Optional[UartPacket]:
    """Parse and validate a single complete UART frame."""
    text = frame.strip()
    m_sensor = _SENSOR_RE.match(text)
    if m_sensor:
        zone_id = int(m_sensor.group(1))
        key = m_sensor.group(2)
        val = float(m_sensor.group(3))
        lo, hi = SENSOR_RANGES[key]
        if not (lo <= val <= hi):
            return None
        return UartPacket(zone_id=zone_id, key=key, value=val, kind="SENSOR")

    m_act = _ACTUATOR_RE.match(text)
    if m_act:
        return UartPacket(
            zone_id=int(m_act.group(1)),
            key=m_act.group(2),
            value=m_act.group(3),
            kind="ACTUATOR",
        )
    return None


def format_actuator_frame(zone_id: int, key: str, state: str) -> str:
    """Serialize a downlink actuator command per contracts/uart.md."""
    norm_key = key.upper()
    norm_state = state.upper()
    if norm_key not in ACTUATOR_KEYS or norm_state not in {"ON", "OFF"}:
        raise ValueError(f"Invalid actuator command: {key}={state}")
    return f"!{zone_id}:{norm_key}:{norm_state}#"


class UartStreamDecoder:
    """Accumulates raw UART bytes/text and yields valid framed packets."""

    def __init__(self, max_buffer: int = 1024) -> None:
        self._buf = ""
        self._max_buffer = max_buffer

    def feed(self, chunk: str) -> List[UartPacket]:
        if not chunk:
            return []
        self._buf += chunk
        packets: List[UartPacket] = []

        while True:
            start = self._buf.find("!")
            if start == -1:
                self._buf = ""
                break
            if start > 0:
                self._buf = self._buf[start:]

            end = self._buf.find("#", 1)
            if end == -1:
                if len(self._buf) > self._max_buffer:
                    self._buf = ""
                break

            raw_frame = self._buf[: end + 1]
            self._buf = self._buf[end + 1 :]

            # Recover if a corrupted frame contains a nested '!' before '#'
            last_bang = raw_frame.rfind("!")
            if last_bang > 0:
                raw_frame = raw_frame[last_bang:]

            pkt = parse_frame(raw_frame)
            if pkt is not None:
                packets.append(pkt)

        return packets