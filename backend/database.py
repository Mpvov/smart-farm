import datetime
import hashlib
import json
import os
import sqlite3
from typing import Any, Dict, List, Optional

DB_PATH = os.environ.get("SMARTFARM_DB_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "smartfarm.db"))


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def get_db():
    conn = sqlite3.connect(os.environ.get("SMARTFARM_DB_PATH", DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL, -- 'ADMIN', 'OPERATOR'
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS farms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        total_area REAL NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS zones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        crop_type TEXT NOT NULL,
        area_m2 REAL NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (farm_id) REFERENCES farms(id)
    );

    CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hardware_uid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- 'SENSOR', 'ACTUATOR'
        metrics_json TEXT NOT NULL, -- '["TEMP", "HUMI"]'
        zone_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'ONLINE', -- 'ONLINE', 'OFFLINE'
        is_simulated INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
    );

    CREATE TABLE IF NOT EXISTS actuator_states (
        device_id INTEGER PRIMARY KEY,
        state TEXT NOT NULL DEFAULT 'OFF', -- 'ON', 'OFF'
        mode TEXT NOT NULL DEFAULT 'AUTO',  -- 'AUTO', 'MANUAL'
        last_action_at TEXT NOT NULL,
        FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        device_id INTEGER NOT NULL,
        metric TEXT NOT NULL,
        value REAL NOT NULL,
        recorded_at TEXT NOT NULL,
        FOREIGN KEY (zone_id) REFERENCES zones(id),
        FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE INDEX IF NOT EXISTS idx_telemetry_zone_metric ON telemetry(zone_id, metric, recorded_at);

    CREATE TABLE IF NOT EXISTS thresholds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        metric TEXT NOT NULL,
        warning_min REAL NOT NULL,
        warning_max REAL NOT NULL,
        danger_min REAL NOT NULL,
        danger_max REAL NOT NULL,
        auto_actions_json TEXT, -- '[{"trigger": "BELOW_DANGER_MIN", "target_device_id": 101, "action": "ON"}]'
        FOREIGN KEY (zone_id) REFERENCES zones(id)
    );

    CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone_id INTEGER NOT NULL,
        device_id INTEGER NOT NULL,
        start_time TEXT NOT NULL, -- "HH:MM"
        duration_minutes INTEGER NOT NULL,
        days_of_week_json TEXT NOT NULL, -- '[1,2,3,4,5,6,7]'
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (zone_id) REFERENCES zones(id),
        FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER NOT NULL,
        zone_id INTEGER NOT NULL,
        device_id INTEGER,
        metric TEXT,
        severity TEXT NOT NULL, -- 'CRITICAL', 'WARNING', 'INFO'
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'UNACKNOWLEDGED', -- 'UNACKNOWLEDGED', 'ACKNOWLEDGED', 'RESOLVED'
        note TEXT,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        FOREIGN KEY (farm_id) REFERENCES farms(id),
        FOREIGN KEY (zone_id) REFERENCES zones(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        user_id INTEGER,
        user_name TEXT NOT NULL,
        role TEXT NOT NULL,
        event_type TEXT NOT NULL, -- 'LOGIN', 'DEVICE_CONTROL', 'CONFIG_CHANGE', 'ALERT_ACK'
        farm_name TEXT,
        zone_name TEXT,
        device_name TEXT,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT
    );
    """)
    conn.commit()

    # Seed initial data if users table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_data(conn)
    conn.close()


def seed_data(conn: sqlite3.Connection):
    cursor = conn.cursor()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # 1. Users
    cursor.execute("""
    INSERT INTO users (email, password_hash, full_name, role, is_active, created_at)
    VALUES (?, ?, ?, ?, 1, ?)
    """, ("admin@smartfarm.vn", hash_password("admin123"), "Quản Trị Viên (Owner)", "ADMIN", now_iso))

    cursor.execute("""
    INSERT INTO users (email, password_hash, full_name, role, is_active, created_at)
    VALUES (?, ?, ?, ?, 1, ?)
    """, ("operator@smartfarm.vn", hash_password("operator123"), "Trần Kỹ Thuật (Operator)", "OPERATOR", now_iso))

    # 2. Farms
    cursor.execute("""
    INSERT INTO farms (name, location, total_area, created_at)
    VALUES (?, ?, ?, ?)
    """, ("Trang trại Đà Lạt Mộng Mơ", "Phường 7, TP. Đà Lạt, Lâm Đồng", 5000.0, now_iso))
    farm_id = cursor.lastrowid

    # 3. Zones
    zones_def = [
        ("Khu A - Dâu tây", "Dâu tây New Zealand", 1200.0, "Canh tác ngoài trời luống cao"),
        ("Khu B - Cà chua bi", "Cà chua bi Cherry", 1500.0, "Canh tác ngoài trời giàn leo"),
        ("Khu C - Xà lách thủy canh", "Xà lách Romaine", 1000.0, "Canh tác máng bán tự nhiên"),
        ("Khu D - Ớt chuông", "Ớt chuông Đà Lạt", 1300.0, "Canh tác ngoài trời luống thấp"),
    ]
    zone_ids = []
    for name, crop, area, desc in zones_def:
        cursor.execute("""
        INSERT INTO zones (farm_id, name, crop_type, area_m2, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (farm_id, name, crop, area, desc, now_iso))
        zone_ids.append(cursor.lastrowid)

    # 4. Devices for Zone 1 (PoC Zone) and other zones
    # Zone 1
    devices_z1 = [
        ("DHT20-Z1-01", "Cảm biến Vi khí hậu Z1", "SENSOR", ["TEMP", "HUMI"], zone_ids[0], 0), # hardware poc
        ("SOIL-Z1-01", "Cảm biến Độ ẩm đất Z1", "SENSOR", ["SOIL"], zone_ids[0], 0),
        ("LIGHT-Z1-01", "Cảm biến Ánh sáng Z1", "SENSOR", ["LIGHT"], zone_ids[0], 0),
        ("PUMP-Z1-01", "Máy bơm tưới đất Z1", "ACTUATOR", ["PUMP"], zone_ids[0], 0),
        ("VALVE-Z1-01", "Van điện từ luống Z1", "ACTUATOR", ["VALVE"], zone_ids[0], 1),
        ("LED-Z1-01", "Đèn chiếu sáng xua côn trùng Z1", "ACTUATOR", ["LED"], zone_ids[0], 0),
    ]

    for uid, name, dtype, metrics, zid, is_sim in devices_z1:
        cursor.execute("""
        INSERT INTO devices (hardware_uid, name, type, metrics_json, zone_id, status, is_simulated, created_at)
        VALUES (?, ?, ?, ?, ?, 'ONLINE', ?, ?)
        """, (uid, name, dtype, json.dumps(metrics), zid, is_sim, now_iso))
        dev_id = cursor.lastrowid
        if dtype == "ACTUATOR":
            cursor.execute("""
            INSERT INTO actuator_states (device_id, state, mode, last_action_at)
            VALUES (?, 'OFF', 'AUTO', ?)
            """, (dev_id, now_iso))

    # Add devices for Zone 2, 3, 4 (simulated)
    for i, zid in enumerate(zone_ids[1:], start=2):
        sim_devs = [
            (f"DHT20-Z{i}-01", f"Cảm biến Vi khí hậu Z{i}", "SENSOR", ["TEMP", "HUMI"], zid),
            (f"SOIL-Z{i}-01", f"Cảm biến Độ ẩm đất Z{i}", "SENSOR", ["SOIL"], zid),
            (f"LIGHT-Z{i}-01", f"Cảm biến Ánh sáng Z{i}", "SENSOR", ["LIGHT"], zid),
            (f"PUMP-Z{i}-01", f"Máy bơm tưới đất Z{i}", "ACTUATOR", ["PUMP"], zid),
            (f"LED-Z{i}-01", f"Đèn chiếu sáng Z{i}", "ACTUATOR", ["LED"], zid),
        ]
        for uid, name, dtype, metrics, z_id in sim_devs:
            cursor.execute("""
            INSERT INTO devices (hardware_uid, name, type, metrics_json, zone_id, status, is_simulated, created_at)
            VALUES (?, ?, ?, ?, ?, 'ONLINE', 1, ?)
            """, (uid, name, dtype, json.dumps(metrics), z_id, now_iso))
            d_id = cursor.lastrowid
            if dtype == "ACTUATOR":
                cursor.execute("""
                INSERT INTO actuator_states (device_id, state, mode, last_action_at)
                VALUES (?, 'OFF', 'AUTO', ?)
                """, (d_id, now_iso))

    # 5. Thresholds for Zone 1
    thresholds = [
        (zone_ids[0], "TEMP", 18.0, 32.0, 15.0, 38.0, json.dumps([{"trigger": "ABOVE_DANGER_MAX", "action": "ALERT"}])),
        (zone_ids[0], "HUMI", 50.0, 85.0, 40.0, 95.0, None),
        (zone_ids[0], "SOIL", 45.0, 75.0, 30.0, 85.0, json.dumps([{"trigger": "BELOW_DANGER_MIN", "action": "ON", "target_metric": "PUMP"}])),
        (zone_ids[0], "LIGHT", 1000.0, 8000.0, 500.0, 10000.0, None),
    ]
    for zid, metric, wmin, wmax, dmin, dmax, auto_act in thresholds:
        cursor.execute("""
        INSERT INTO thresholds (zone_id, metric, warning_min, warning_max, danger_min, danger_max, auto_actions_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (zid, metric, wmin, wmax, dmin, dmax, auto_act))

    # 6. Schedules for Zone 1
    cursor.execute("""
    INSERT INTO schedules (zone_id, device_id, start_time, duration_minutes, days_of_week_json, is_active)
    VALUES (?, 4, '06:00', 15, '[1,2,3,4,5,6,7]', 1)
    """, (zone_ids[0],))

    cursor.execute("""
    INSERT INTO schedules (zone_id, device_id, start_time, duration_minutes, days_of_week_json, is_active)
    VALUES (?, 4, '17:00', 20, '[1,2,3,4,5,6,7]', 1)
    """, (zone_ids[0],))

    # 7. Seed 24 hours of historical telemetry for Zone 1
    base_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)
    for hour in range(25):
        t_time = (base_time + datetime.timedelta(hours=hour)).isoformat()
        # Temp varies between 20 and 28
        temp_val = round(22.0 + 5.0 * (hour % 12) / 12.0, 1)
        # Humi varies between 60 and 80
        humi_val = round(75.0 - 10.0 * (hour % 12) / 12.0, 1)
        # Soil varies between 50 and 65
        soil_val = round(58.0 + 4.0 * (hour % 6) / 6.0, 1)
        # Light varies between 0 and 5000
        light_val = round(3000.0 if 6 <= (hour % 24) <= 18 else 100.0, 1)

        cursor.execute("INSERT INTO telemetry (zone_id, device_id, metric, value, recorded_at) VALUES (?, 1, 'TEMP', ?, ?)", (zone_ids[0], temp_val, t_time))
        cursor.execute("INSERT INTO telemetry (zone_id, device_id, metric, value, recorded_at) VALUES (?, 1, 'HUMI', ?, ?)", (zone_ids[0], humi_val, t_time))
        cursor.execute("INSERT INTO telemetry (zone_id, device_id, metric, value, recorded_at) VALUES (?, 2, 'SOIL', ?, ?)", (zone_ids[0], soil_val, t_time))
        cursor.execute("INSERT INTO telemetry (zone_id, device_id, metric, value, recorded_at) VALUES (?, 3, 'LIGHT', ?, ?)", (zone_ids[0], light_val, t_time))

    # 8. Sample Alert
    cursor.execute("""
    INSERT INTO alerts (farm_id, zone_id, device_id, metric, severity, message, status, note, created_at)
    VALUES (?, ?, 2, 'SOIL', 'WARNING', 'Độ ẩm đất Khu A đang giảm dần về mức cảnh báo (42.5%)', 'UNACKNOWLEDGED', NULL, ?)
    """, (farm_id, zone_ids[0], now_iso))

    # 9. Sample Audit Logs
    cursor.execute("""
    INSERT INTO audit_logs (timestamp, user_id, user_name, role, event_type, farm_name, zone_name, device_name, action, details, ip_address)
    VALUES (?, 1, 'Quản Trị Viên (Admin)', 'ADMIN', 'DEVICE_CONTROL', 'Trang trại Đà Lạt Mộng Mơ', 'Khu A - Dâu tây', 'Máy bơm tưới đất Z1', 'Bật máy bơm thủ công', 'Chạy tưới bù ẩm 15 phút', '127.0.0.1')
    """, (now_iso,))

    cursor.execute("""
    INSERT INTO audit_logs (timestamp, user_id, user_name, role, event_type, farm_name, zone_name, device_name, action, details, ip_address)
    VALUES (?, 1, 'Quản Trị Viên (Admin)', 'ADMIN', 'CONFIG_CHANGE', 'Trang trại Đà Lạt Mộng Mơ', 'Khu A - Dâu tây', NULL, 'Cập nhật ngưỡng an toàn', 'Đặt ngưỡng độ ẩm đất an toàn 45% - 75%', '127.0.0.1')
    """, (now_iso,))

    conn.commit()


def log_audit(user_id: Optional[int], user_name: str, role: str, event_type: str,
              action: str, details: Optional[str] = None, farm_name: Optional[str] = None,
              zone_name: Optional[str] = None, device_name: Optional[str] = None,
              ip_address: Optional[str] = "127.0.0.1"):
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO audit_logs (timestamp, user_id, user_name, role, event_type, farm_name, zone_name, device_name, action, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (now_iso, user_id, user_name, role, event_type, farm_name, zone_name, device_name, action, details, ip_address))
    conn.commit()
    conn.close()
