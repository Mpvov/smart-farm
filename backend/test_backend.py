import asyncio
import pytest
from starlette.testclient import TestClient
from backend.main import app
from backend.database import get_db
from backend.simulator import simulator

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    test_db = str(tmp_path / "test_smartfarm.db")
    monkeypatch.setenv("SMARTFARM_DB_PATH", test_db)
    from backend.database import init_db
    init_db()
    yield


# ==========================================
# 1. Tests ban đầu (giữ nguyên ý nghĩa 6 case cũ)
# ==========================================
def test_auth_login_success():
    res = client.post("/api/v1/auth/login", json={"email": "admin@smartfarm.vn", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "ADMIN"


def test_dashboard_summary():
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["total_zones"] >= 1
    assert data["data"]["total_devices"] >= 1


def test_zones_telemetry_latest():
    res = client.get("/api/v1/zones/1/telemetry/latest")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "TEMP" in data["data"]["metrics"]
    assert "SOIL" in data["data"]["metrics"]


def test_device_control():
    # Find an actuator
    res = client.get("/api/v1/zones/1/actuators")
    assert res.status_code == 200
    actuators = res.json()["data"]
    assert len(actuators) > 0
    dev_id = actuators[0]["device_id"]

    # Control ON
    res_ctrl = client.post(f"/api/v1/devices/{dev_id}/control", json={"action": "ON"})
    assert res_ctrl.status_code == 200
    assert res_ctrl.json()["data"]["new_state"] == "ON"


def test_alerts_and_audit():
    # Alerts
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Audit logs
    res_audit = client.get("/api/v1/audit-logs")
    assert res_audit.status_code == 200
    assert len(res_audit.json()["data"]) > 0


def test_reports_analytics():
    res = client.get("/api/v1/reports/analytics?zone_id=1")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "summary" in data["data"]
    assert len(data["data"]["series"]) > 0


# ==========================================
# 2. Logic chưa được test (FR-BE-05, FR-BE-09)
# ==========================================
def test_FR_BE_05_simulator_auto_action_below_danger_min():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE actuator_states SET state = 'OFF', mode = 'AUTO' WHERE device_id = 4")
    cursor.execute("UPDATE thresholds SET danger_min = 70.0 WHERE zone_id = 1 AND metric = 'SOIL'")
    conn.commit()
    conn.close()

    asyncio.run(simulator._generate_step())

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT state FROM actuator_states WHERE device_id = 4")
    state = cursor.fetchone()["state"]
    cursor.execute("UPDATE thresholds SET danger_min = 30.0 WHERE zone_id = 1 AND metric = 'SOIL'")
    conn.commit()
    conn.close()

    assert state == "ON"


def test_FR_BE_05_simulator_safe_range_preserves_actuator():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE actuator_states SET state = 'OFF', mode = 'AUTO' WHERE device_id = 4")
    cursor.execute("UPDATE thresholds SET danger_min = 30.0, danger_max = 85.0 WHERE zone_id = 1 AND metric = 'SOIL'")
    conn.commit()
    conn.close()

    asyncio.run(simulator._generate_step())

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT state FROM actuator_states WHERE device_id = 4")
    state = cursor.fetchone()["state"]
    conn.close()

    assert state == "OFF"


def test_FR_BE_09_rbac_admin_can_create_user():
    import uuid
    res_login = client.post("/api/v1/auth/login", json={"email": "admin@smartfarm.vn", "password": "admin123"})
    token = res_login.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    unique_email = f"new_operator_{uuid.uuid4().hex[:6]}@smartfarm.vn"
    res = client.post(
        "/api/v1/users",
        json={
            "email": unique_email,
            "full_name": "Nhân Viên Mới",
            "password": "password123",
            "role": "OPERATOR",
        },
        headers=headers,
    )
    assert res.status_code == 200


@pytest.mark.xfail(strict=True, reason="BUG FR-BE-09: main.py:756 khong kiem role")
def test_FR_BE_09_rbac_operator_cannot_create_user():
    res_login = client.post("/api/v1/auth/login", json={"email": "operator@smartfarm.vn", "password": "operator123"})
    token = res_login.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/api/v1/users",
        json={
            "email": "illegal_user@smartfarm.vn",
            "full_name": "Illegal User",
            "password": "password123",
            "role": "OPERATOR",
        },
        headers=headers,
    )
    assert res.status_code == 403


@pytest.mark.xfail(strict=True, reason="CHUA LAM FR-BE-10: chua co route DELETE zone")
def test_FR_BE_10_rbac_operator_cannot_delete_zone():
    res_login = client.post("/api/v1/auth/login", json={"email": "operator@smartfarm.vn", "password": "operator123"})
    token = res_login.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.delete("/api/v1/zones/1", headers=headers)
    assert res.status_code == 403
