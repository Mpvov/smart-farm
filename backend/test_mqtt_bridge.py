from __future__ import annotations

import asyncio

from backend.database import get_db, init_db
from backend.mqtt_bridge import BackendMqttBridge
from backend.simulator import simulator


def test_mqtt_bridge_ingests_telemetry_for_zone1_hardware(tmp_path, monkeypatch):
    monkeypatch.setenv("SMARTFARM_DB_PATH", str(tmp_path / "test_mqtt.db"))
    init_db()
    bridge = BackendMqttBridge()

    assert bridge.ingest_telemetry("TEMP", "29.4") is True
    assert bridge.ingest_telemetry("LIGHT", "80.0") is True
    conn = get_db()
    row = conn.execute(
        "SELECT metric, value FROM telemetry WHERE zone_id = 1 AND metric = 'TEMP' ORDER BY id DESC LIMIT 1"
    ).fetchone()
    light_row = conn.execute(
        "SELECT metric, value FROM telemetry WHERE zone_id = 1 AND metric = 'LIGHT' ORDER BY id DESC LIMIT 1"
    ).fetchone()
    conn.close()
    assert row["metric"] == "TEMP"
    assert row["value"] == 29.4
    assert light_row["metric"] == "LIGHT"
    assert light_row["value"] == 80.0


def test_mqtt_bridge_creates_alert_on_threshold_breach(tmp_path, monkeypatch):
    monkeypatch.setenv("SMARTFARM_DB_PATH", str(tmp_path / "test_mqtt_alert.db"))
    init_db()
    bridge = BackendMqttBridge()

    assert bridge.ingest_telemetry("TEMP", "41.5") is True
    conn = get_db()
    alert = conn.execute(
        "SELECT metric, severity, status FROM alerts WHERE zone_id = 1 AND metric = 'TEMP' ORDER BY id DESC LIMIT 1"
    ).fetchone()
    conn.close()
    assert alert is not None
    assert alert["severity"] == "CRITICAL"
    assert alert["status"] == "UNACKNOWLEDGED"


def test_simulator_skips_hardware_sensors_when_mqtt_enabled(tmp_path, monkeypatch):
    from backend import mqtt_bridge as mb_mod

    monkeypatch.setenv("SMARTFARM_DB_PATH", str(tmp_path / "test_sim_skip.db"))
    init_db()
    conn = get_db()
    before_count = conn.execute("SELECT COUNT(*) FROM telemetry WHERE zone_id = 1").fetchone()[0]
    conn.close()

    monkeypatch.setattr(mb_mod.mqtt_bridge, "_enabled", True)
    asyncio.run(simulator._generate_step())

    conn = get_db()
    after_z1 = conn.execute("SELECT COUNT(*) FROM telemetry WHERE zone_id = 1").fetchone()[0]
    after_z2 = conn.execute("SELECT COUNT(*) FROM telemetry WHERE zone_id = 2").fetchone()[0]
    conn.close()
    assert after_z1 == before_count
    assert after_z2 > 0


def test_mqtt_bridge_syncs_external_toggle_and_suppresses_self_echo(tmp_path, monkeypatch):
    monkeypatch.setenv("SMARTFARM_DB_PATH", str(tmp_path / "test_mqtt_act.db"))
    init_db()
    bridge = BackendMqttBridge(echo_guard_sec=2.0)

    # 1. External physical toggle from Yolo:Bit -> Broker -> Backend
    assert bridge.ingest_actuator_state("PUMP", "1", now=100.0) is True
    conn = get_db()
    state_row = conn.execute(
        """
        SELECT a.state FROM actuator_states a
        JOIN devices d ON d.id = a.device_id
        WHERE d.hardware_uid = 'PUMP-Z1-01'
        """
    ).fetchone()
    audit_count = conn.execute(
        "SELECT COUNT(*) FROM audit_logs WHERE user_name = 'Thiết bị hiện trường (MQTT)'"
    ).fetchone()[0]
    conn.close()
    assert state_row["state"] == "ON"
    assert audit_count == 1

    # 2. Simulate Backend publishing OFF from REST API, then Adafruit IO echoing "0" back
    bridge._last_published["PUMP"] = ("OFF", 200.0)
    assert bridge.ingest_actuator_state("PUMP", "0", now=200.4) is False