import json
import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from starlette.testclient import TestClient

tmp_dir = tempfile.mkdtemp()
os.environ["SMARTFARM_DB_PATH"] = os.path.join(tmp_dir, "contract_test.db")
from backend.database import init_db
from backend.main import app

init_db()
client = TestClient(app)
SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")


def check_shape(actual, expected, path=""):
    if type(actual) is not type(expected):
        return f"{path}: kieu khong khop ({type(actual).__name__} != {type(expected).__name__})"
    if isinstance(actual, dict):
        if set(actual.keys()) != set(expected.keys()):
            return f"{path}: keys khong khop ({set(actual.keys())} != {set(expected.keys())})"
        for k in expected:
            err = check_shape(actual[k], expected[k], f"{path}.{k}" if path else k)
            if err:
                return err
    elif isinstance(actual, list) and expected and actual:
        return check_shape(actual[0], expected[0], f"{path}[0]")
    return None


def _load_sample(name):
    with open(os.path.join(SAMPLES_DIR, name), "r", encoding="utf-8") as f:
        return json.load(f)


def _get_admin_headers():
    res = client.post("/api/v1/auth/login", json={"email": "admin@smartfarm.vn", "password": "admin123"})
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.parametrize(
    "method,url,body,sample_file,use_auth",
    [
        ("POST", "/api/v1/auth/login", {"email": "admin@smartfarm.vn", "password": "admin123"}, "api_auth_login.json", False),
        ("GET", "/api/v1/farms", None, "api_farms.json", False),
        ("GET", "/api/v1/farms/1/zones", None, "api_farm_zones.json", False),
        ("POST", "/api/v1/farms/1/zones", {"name": "Z", "crop_type": "T", "area_m2": 10.0, "description": ""}, "api_create_zone.json", False),
        ("GET", "/api/v1/alerts?farm_id=1", None, "api_alerts.json", False),
        ("POST", "/api/v1/alerts/1/acknowledge", {"note": "ok"}, "api_alert_acknowledge.json", False),
        ("GET", "/api/v1/audit-logs", None, "api_audit_logs.json", False),
        ("GET", "/api/v1/dashboard/summary?farm_id=1", None, "api_dashboard_summary.json", False),
        ("GET", "/api/v1/zones/1/telemetry/latest", None, "api_telemetry_latest.json", False),
        ("GET", "/api/v1/zones/1/telemetry/history?metric=SOIL&hours=24", None, "api_telemetry_history.json", False),
        ("GET", "/api/v1/zones/1/actuators", None, "api_actuators.json", False),
        ("POST", "/api/v1/devices/4/control", {"action": "ON"}, "api_device_control.json", False),
        ("GET", "/api/v1/devices?zone_id=1", None, "api_devices.json", False),
        ("POST", "/api/v1/devices", {"name": "D", "type": "SENSOR", "metrics": ["TEMP"], "zone_id": 1, "hardware_uid": "UID-1"}, "api_create_device.json", False),
        ("GET", "/api/v1/reports/analytics?farm_id=1&zone_id=1", None, "api_reports_analytics.json", False),
        ("GET", "/api/v1/zones/1/thresholds", None, "api_thresholds.json", False),
        ("GET", "/api/v1/zones/1/schedules", None, "api_schedules.json", False),
        ("POST", "/api/v1/zones/1/schedules", {"device_id": 4, "start_time": "07:00", "duration_minutes": 10, "days_of_week": [1]}, "api_create_schedule.json", False),
        ("DELETE", "/api/v1/schedules/1", None, "api_delete_schedule.json", False),
        ("GET", "/api/v1/users", None, "api_users.json", False),
        ("POST", "/api/v1/users", {"email": "contract_u@sf.vn", "password": "p", "full_name": "N", "role": "OPERATOR"}, "api_create_user.json", True),
    ],
)
def test_api_contract_shape(method, url, body, sample_file, use_auth):
    headers = _get_admin_headers() if use_auth else {}
    if method == "GET":
        res = client.get(url, headers=headers)
    elif method == "POST":
        res = client.post(url, json=body, headers=headers)
    elif method == "DELETE":
        res = client.delete(url, headers=headers)
    assert res.status_code == 200, f"{url} status={res.status_code}: {res.text}"
    expected = _load_sample(sample_file)
    diff = check_shape(res.json(), expected)
    assert diff is None, f"{sample_file} shape mismatch: {diff}"


@pytest.mark.xfail(strict=True, reason="BUG FR-BE-01: main.py:463 ON CONFLICT thieu UNIQUE constraint trong database.py")
def test_api_contract_update_thresholds_shape():
    res = client.put(
        "/api/v1/zones/1/thresholds",
        json={"thresholds": [{"metric": "SOIL", "warning_min": 35.0, "warning_max": 75.0, "danger_min": 20.0, "danger_max": 85.0}]},
    )
    assert res.status_code == 200
    expected = _load_sample("api_update_thresholds.json")
    diff = check_shape(res.json(), expected)
    assert diff is None


if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main([__file__, "-q"]))
