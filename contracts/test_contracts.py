#!/usr/bin/env python3
"""
Test runner for contracts samples.
Validates that every sample file complies with uart.md and mqtt.md specs.
Exits 0 on success, 1 on failure.
"""

import json
import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLES_DIR = os.path.join(BASE_DIR, "samples")

UART_SENSOR_REGEX = re.compile(r"^!(\d+):(TEMP|HUMI|SOIL):([0-9.]+)#$")
UART_ACTUATOR_REGEX = re.compile(r"^!(\d+):(PUMP|LED):(ON|OFF)#$")

VALID_FEEDS_TELEMETRY = {"smartfarm-temp", "smartfarm-humi", "smartfarm-soil"}
VALID_FEEDS_COMMAND = {"smartfarm-pump", "smartfarm-led"}


def test_uart_sensor_samples():
    path = os.path.join(SAMPLES_DIR, "uart_sensor_samples.txt")
    assert os.path.exists(path), f"Missing {path}"
    with open(path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    assert len(lines) > 0, "No UART sensor samples found"
    for line in lines:
        match = UART_SENSOR_REGEX.match(line)
        assert match is not None, f"Invalid UART sensor format: '{line}'"
        zone, key, val = match.groups()
        assert float(val) is not None, f"Invalid sensor number: '{val}'"
    print(f"[OK] UART Sensor Samples ({len(lines)} lines)")


def test_uart_actuator_samples():
    path = os.path.join(SAMPLES_DIR, "uart_actuator_samples.txt")
    assert os.path.exists(path), f"Missing {path}"
    with open(path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    assert len(lines) > 0, "No UART actuator samples found"
    for line in lines:
        match = UART_ACTUATOR_REGEX.match(line)
        assert match is not None, f"Invalid UART actuator format: '{line}'"
    print(f"[OK] UART Actuator Samples ({len(lines)} lines)")


def test_mqtt_telemetry_samples():
    path = os.path.join(SAMPLES_DIR, "mqtt_telemetry_samples.json")
    assert os.path.exists(path), f"Missing {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, list) and len(data) > 0, "Invalid telemetry JSON format"
    for item in data:
        assert item.get("feed") in VALID_FEEDS_TELEMETRY, f"Unknown feed: {item.get('feed')}"
        assert isinstance(item.get("value"), (int, float)), f"Value must be numeric: {item.get('value')}"
    print(f"[OK] MQTT Telemetry Samples ({len(data)} items)")


def test_mqtt_command_samples():
    path = os.path.join(SAMPLES_DIR, "mqtt_command_samples.json")
    assert os.path.exists(path), f"Missing {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, list) and len(data) > 0, "Invalid command JSON format"
    for item in data:
        assert item.get("feed") in VALID_FEEDS_COMMAND, f"Unknown feed: {item.get('feed')}"
        assert item.get("value") in {"0", "1"}, f"Value must be '0' or '1': {item.get('value')}"
    print(f"[OK] MQTT Command Samples ({len(data)} items)")


def main():
    try:
        test_uart_sensor_samples()
        test_uart_actuator_samples()
        test_mqtt_telemetry_samples()
        test_mqtt_command_samples()
        print("\nAll contract samples passed verification.")
        sys.exit(0)
    except AssertionError as err:
        print(f"\n[FAIL] Contract test failed: {err}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"\n[ERROR] Unexpected error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
