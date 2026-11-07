import pytest
from starlette.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_and_auth():
    # 1. Login
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

if __name__ == "__main__":
    test_health_and_auth()
    test_dashboard_summary()
    test_zones_telemetry_latest()
    test_device_control()
    test_alerts_and_audit()
    test_reports_analytics()
    print("[OK] All backend test cases passed 100%!")
