from __future__ import annotations

import queue
import random
import threading
import time
from typing import Protocol


class SerialTransport(Protocol):
    def read_chunk(self) -> str: ...
    def write_frame(self, frame: str) -> None: ...
    def close(self) -> None: ...


class PySerialTransport:
    """Real USB-UART connection to Yolo:Bit (115200 bps, 8N1)."""

    def __init__(self, port: str, baudrate: int = 115200, timeout: float = 0.2) -> None:
        import serial

        self._ser = serial.Serial(
            port=port,
            baudrate=baudrate,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=timeout,
        )

    def read_chunk(self) -> str:
        waiting = self._ser.in_waiting
        data = self._ser.read(waiting or 1)
        return data.decode("utf-8", errors="ignore")

    def write_frame(self, frame: str) -> None:
        self._ser.write((frame + "\n").encode("utf-8"))
        self._ser.flush()

    def close(self) -> None:
        if self._ser.is_open:
            self._ser.close()


class MockSerialTransport:
    """
    Virtual Yolo:Bit for remote development (SERIAL_PORT=MOCK).
    Emits sensor frames periodically and accepts terminal commands
    (e.g. 'pump on', 'pump off', 'led on', 'led off') to simulate physical buttons.
    """

    def __init__(self, emit_interval: float = 5.0, interactive: bool = True) -> None:
        self._rx: queue.Queue[str] = queue.Queue()
        self._stop = threading.Event()
        self._emit_interval = emit_interval
        self._sensor_thread = threading.Thread(target=self._sensor_loop, daemon=True)
        self._sensor_thread.start()
        if interactive:
            self._stdin_thread = threading.Thread(target=self._stdin_loop, daemon=True)
            self._stdin_thread.start()

    def _sensor_loop(self) -> None:
        temp, humi, soil = 27.5, 66.0, 44.0
        while not self._stop.is_set():
            temp = round(max(18.0, min(36.0, temp + random.uniform(-0.4, 0.4))), 1)
            humi = round(max(45.0, min(85.0, humi + random.uniform(-1.0, 1.0))), 1)
            soil = round(max(25.0, min(80.0, soil + random.uniform(-0.8, 0.8))), 1)
            self._rx.put(f"!1:TEMP:{temp}#!1:HUMI:{humi}#!1:SOIL:{soil}#")
            self._stop.wait(self._emit_interval)

    def _stdin_loop(self) -> None:
        print(
            "[MOCK Yolo:Bit] Type 'pump on', 'pump off', 'led on', 'led off' "
            "to simulate physical button toggles:"
        )
        while not self._stop.is_set():
            try:
                line = input().strip().upper()
            except EOFError:
                break
            parts = line.split()
            if len(parts) == 2 and parts[0] in {"PUMP", "LED"} and parts[1] in {"ON", "OFF"}:
                frame = f"!1:{parts[0]}:{parts[1]}#"
                print(f"[MOCK Yolo:Bit -> UART] Physical button pressed: {frame}")
                self._rx.put(frame)
            elif line:
                print("[MOCK Yolo:Bit] Commands: 'pump on' | 'pump off' | 'led on' | 'led off'")

    def read_chunk(self) -> str:
        try:
            return self._rx.get(timeout=0.2)
        except queue.Empty:
            return ""

    def write_frame(self, frame: str) -> None:
        print(f"[UART -> MOCK Yolo:Bit] Relay/LED executed: {frame}")
        # Simulate hardware echoing confirmed state back over UART
        time.sleep(0.05)
        self._rx.put(frame)

    def close(self) -> None:
        self._stop.set()