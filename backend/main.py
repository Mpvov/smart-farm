import asyncio
import csv
import datetime
import io
import json
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from backend.database import get_db, hash_password, init_db, log_audit
from backend.simulator import simulator


init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    await simulator.start()
    yield
    await simulator.stop()


app = FastAPI(
    title="Smart Farm API",
    version="1.0.0",
    description="REST & SSE API for Smart Farm Device Management System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Pydantic Schemas
# ==========================================
class LoginRequest(BaseModel):
    email: str
    password: str


class ControlRequest(BaseModel):
    action: str  # "ON" or "OFF"
    duration_minutes: Optional[int] = None


class ThresholdItem(BaseModel):
    metric: str
    warning_min: float
    warning_max: float
    danger_min: float
    danger_max: float
    auto_actions: Optional[List[Dict[str, Any]]] = None


class UpdateThresholdsRequest(BaseModel):
    thresholds: List[ThresholdItem]


class ScheduleCreateRequest(BaseModel):
    device_id: int
    start_time: str
    duration_minutes: int
    days_of_week: List[int]
    is_active: bool = True


class AlertAckRequest(BaseModel):
    note: str


class UserCreateRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str  # "ADMIN" or "OPERATOR"


class FarmCreateRequest(BaseModel):
    name: str
    location: str
    total_area: float


class ZoneCreateRequest(BaseModel):
    name: str
    crop_type: str
    area_m2: float
    description: Optional[str] = None


class DeviceCreateRequest(BaseModel):
    hardware_uid: str
    name: str
    type: str  # "SENSOR" or "ACTUATOR"
    metrics: List[str]
    zone_id: int
    is_simulated: bool = True


# ==========================================
# 1. Auth Module (SCR-01 | UC-01)
# ==========================================
@app.post("/api/v1/auth/login")
def login(req: LoginRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, email, full_name, role, is_active FROM users WHERE email = ? AND password_hash = ?",
        (req.email, hash_password(req.password)),
    )
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị vô hiệu hóa")

    log_audit(
        user["id"],
        user["full_name"],
        user["role"],
        "LOGIN",
        "Đăng nhập hệ thống",
        f"Đăng nhập thành công từ {user['email']}",
    )

    return {
        "success": True,
        "data": {
            "access_token": f"token-{user['id']}-{hash_password(user['email'])[:12]}",
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"],
            },
        },
        "message": "Đăng nhập thành công",
    }


@app.get("/api/v1/auth/me")
def get_me():
    # Return default admin for prototype
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, role FROM users LIMIT 1")
    user = cursor.fetchone()
    conn.close()
    return {
        "success": True,
        "data": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
        },
    }


@app.post("/api/v1/auth/logout")
def logout():
    return {"success": True, "message": "Đăng xuất thành công"}


# ==========================================
# 2. Live Dashboard Module (SCR-02 | UC-06, G1, G3)
# ==========================================
@app.get("/api/v1/dashboard/summary")
def get_dashboard_summary(farm_id: Optional[int] = Query(None)):
    conn = get_db()
    cursor = conn.cursor()

    if not farm_id:
        cursor.execute("SELECT id, name FROM farms LIMIT 1")
        farm = cursor.fetchone()
        farm_id = farm["id"] if farm else 1
        farm_name = farm["name"] if farm else "Trang trại mẫu"
    else:
        cursor.execute("SELECT name FROM farms WHERE id = ?", (farm_id,))
        f = cursor.fetchone()
        farm_name = f["name"] if f else "Trang trại"

    cursor.execute("SELECT COUNT(*) FROM zones WHERE farm_id = ?", (farm_id,))
    total_zones = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM devices WHERE zone_id IN (SELECT id FROM zones WHERE farm_id = ?)",
        (farm_id,),
    )
    total_devices = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM devices WHERE status = 'ONLINE' AND zone_id IN (SELECT id FROM zones WHERE farm_id = ?)",
        (farm_id,),
    )
    devices_online = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM alerts WHERE farm_id = ? AND status = 'UNACKNOWLEDGED'",
        (farm_id,),
    )
    active_alerts = cursor.fetchone()[0]

    conn.close()
    return {
        "success": True,
        "data": {
            "farm_id": farm_id,
            "farm_name": farm_name,
            "total_zones": total_zones,
            "total_devices": total_devices,
            "devices_online": devices_online,
            "active_alerts_count": active_alerts,
        },
    }


@app.get("/api/v1/zones/{zone_id}/telemetry/latest")
def get_latest_telemetry(zone_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT name, crop_type FROM zones WHERE id = ?", (zone_id,))
    zone = cursor.fetchone()
    if not zone:
        conn.close()
        raise HTTPException(status_code=404, detail="Zone không tồn tại")

    metrics_res = {}
    for m in ["TEMP", "HUMI", "SOIL", "LIGHT"]:
        cursor.execute(
            """
        SELECT value, recorded_at FROM telemetry
        WHERE zone_id = ? AND metric = ?
        ORDER BY recorded_at DESC LIMIT 1
        """,
            (zone_id, m),
        )
        row = cursor.fetchone()
        val = row["value"] if row else 25.0
        rec_at = row["recorded_at"] if row else datetime.datetime.now(datetime.timezone.utc).isoformat()

        # check status
        cursor.execute(
            "SELECT warning_min, warning_max, danger_min, danger_max FROM thresholds WHERE zone_id = ? AND metric = ?",
            (zone_id, m),
        )
        thresh = cursor.fetchone()
        status_label = "NORMAL"
        if thresh:
            if val < thresh["danger_min"] or val > thresh["danger_max"]:
                status_label = "CRITICAL"
            elif val < thresh["warning_min"] or val > thresh["warning_max"]:
                status_label = "WARNING"

        unit = "°C" if m == "TEMP" else "%" if m in ["HUMI", "SOIL"] else "Lux"
        metrics_res[m] = {"value": val, "unit": unit, "status": status_label, "updated_at": rec_at}

    conn.close()
    return {
        "success": True,
        "data": {
            "zone_id": zone_id,
            "zone_name": zone["name"],
            "crop_type": zone["crop_type"],
            "metrics": metrics_res,
        },
    }


@app.get("/api/v1/zones/{zone_id}/telemetry/history")
def get_telemetry_history(zone_id: int, metric: str = "SOIL", range: str = "24h"):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
    SELECT recorded_at as timestamp, value
    FROM telemetry
    WHERE zone_id = ? AND metric = ?
    ORDER BY recorded_at DESC LIMIT 50
    """,
        (zone_id, metric),
    )
    rows = cursor.fetchall()
    conn.close()
    data = [{"timestamp": r["timestamp"], "value": r["value"]} for r in reversed(rows)]
    return {"success": True, "data": data}


@app.get("/api/v1/zones/{zone_id}/telemetry/stream")
async def stream_telemetry(zone_id: int):
    async def event_generator():
        q = simulator.subscribe()
        try:
            while True:
                packet = await q.get()
                if packet.get("data", {}).get("zone_id") == zone_id:
                    yield f"event: telemetry\ndata: {json.dumps(packet['data'])}\n\n"
        except asyncio.CancelledError:
            simulator.unsubscribe(q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ==========================================
# 3. Device Control Module (SCR-03 | UC-07, UC-08, G3)
# ==========================================
@app.get("/api/v1/zones/{zone_id}/actuators")
def get_zone_actuators(zone_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
    SELECT d.id, d.hardware_uid, d.name, d.type, d.metrics_json, d.status,
           a.state, a.mode, a.last_action_at
    FROM devices d
    JOIN actuator_states a ON d.id = a.device_id
    WHERE d.zone_id = ? AND d.type = 'ACTUATOR'
    """,
        (zone_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    res = []
    for r in rows:
        metrics = json.loads(r["metrics_json"])
        res.append(
            {
                "device_id": r["id"],
                "device_code": r["hardware_uid"],
                "name": r["name"],
                "type": r["type"],
                "metric": metrics[0] if metrics else "PUMP",
                "state": r["state"],
                "mode": r["mode"],
                "status": r["status"],
                "last_action_at": r["last_action_at"],
            }
        )
    return {"success": True, "data": res}


@app.post("/api/v1/devices/{device_id}/control")
def control_device(device_id: int, req: ControlRequest):
    if req.action not in ["ON", "OFF"]:
        raise HTTPException(status_code=400, detail="Action must be ON or OFF")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, zone_id FROM devices WHERE id = ?", (device_id,))
    dev = cursor.fetchone()
    if not dev:
        conn.close()
        raise HTTPException(status_code=404, detail="Thiết bị không tồn tại")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute(
        "UPDATE actuator_states SET state = ?, mode = 'MANUAL', last_action_at = ? WHERE device_id = ?",
        (req.action, now_iso, device_id),
    )
    conn.commit()

    log_audit(
        1,
        "Quản Trị Viên (Owner)",
        "ADMIN",
        "DEVICE_CONTROL",
        f"Điều khiển {dev['name']}: {req.action}",
        f"Lệnh chuyển sang {req.action} (Thủ công) qua Dashboard Web",
        device_name=dev["name"],
    )
    conn.close()

    return {
        "success": True,
        "data": {
            "device_id": device_id,
            "new_state": req.action,
            "executed_at": now_iso,
            "ack_status": "SUCCESS",
        },
        "message": f"Đã gửi lệnh {req.action} thiết bị thành công",
    }


# ==========================================
# 4. Threshold & Schedule Module (SCR-04 | UC-09, UC-10, G4, G5)
# ==========================================
@app.get("/api/v1/zones/{zone_id}/thresholds")
def get_zone_thresholds(zone_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, zone_id, metric, warning_min, warning_max, danger_min, danger_max, auto_actions_json FROM thresholds WHERE zone_id = ?",
        (zone_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    res = []
    for r in rows:
        res.append(
            {
                "id": r["id"],
                "zone_id": r["zone_id"],
                "metric": r["metric"],
                "warning_min": r["warning_min"],
                "warning_max": r["warning_max"],
                "danger_min": r["danger_min"],
                "danger_max": r["danger_max"],
                "auto_actions": json.loads(r["auto_actions_json"]) if r["auto_actions_json"] else [],
            }
        )
    return {"success": True, "data": res}


@app.put("/api/v1/zones/{zone_id}/thresholds")
def update_zone_thresholds(zone_id: int, req: UpdateThresholdsRequest):
    conn = get_db()
    cursor = conn.cursor()

    for item in req.thresholds:
        auto_act_str = json.dumps(item.auto_actions) if item.auto_actions else None
        cursor.execute(
            """
        INSERT INTO thresholds (zone_id, metric, warning_min, warning_max, danger_min, danger_max, auto_actions_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(zone_id, metric) DO UPDATE SET
            warning_min = excluded.warning_min,
            warning_max = excluded.warning_max,
            danger_min = excluded.danger_min,
            danger_max = excluded.danger_max,
            auto_actions_json = excluded.auto_actions_json
        """,
            (
                zone_id,
                item.metric,
                item.warning_min,
                item.warning_max,
                item.danger_min,
                item.danger_max,
                auto_act_str,
            ),
        )

    conn.commit()
    log_audit(
        1,
        "Quản Trị Viên (Owner)",
        "ADMIN",
        "CONFIG_CHANGE",
        "Cập nhật ngưỡng an toàn",
        f"Zone {zone_id}: Cập nhật {len(req.thresholds)} cấu hình ngưỡng",
    )
    conn.close()
    return {"success": True, "message": "Đã áp dụng cấu hình ngưỡng mới thành công"}


@app.get("/api/v1/zones/{zone_id}/schedules")
def get_zone_schedules(zone_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
    SELECT s.id, s.zone_id, s.device_id, d.name as device_name,
           s.start_time, s.duration_minutes, s.days_of_week_json, s.is_active
    FROM schedules s
    JOIN devices d ON s.device_id = d.id
    WHERE s.zone_id = ?
    """,
        (zone_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    res = []
    for r in rows:
        res.append(
            {
                "id": r["id"],
                "zone_id": r["zone_id"],
                "device_id": r["device_id"],
                "device_name": r["device_name"],
                "start_time": r["start_time"],
                "duration_minutes": r["duration_minutes"],
                "days_of_week": json.loads(r["days_of_week_json"]),
                "is_active": bool(r["is_active"]),
            }
        )
    return {"success": True, "data": res}


@app.post("/api/v1/zones/{zone_id}/schedules")
def create_schedule(zone_id: int, req: ScheduleCreateRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
    INSERT INTO schedules (zone_id, device_id, start_time, duration_minutes, days_of_week_json, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
    """,
        (
            zone_id,
            req.device_id,
            req.start_time,
            req.duration_minutes,
            json.dumps(req.days_of_week),
            int(req.is_active),
        ),
    )
    sched_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"success": True, "data": {"id": sched_id}, "message": "Tạo lịch trình thành công"}


@app.delete("/api/v1/schedules/{schedule_id}")
def delete_schedule(schedule_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM schedules WHERE id = ?", (schedule_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Đã xóa lịch trình"}


# ==========================================
# 5. Alert Center Module (SCR-05 | UC-11, G6)
# ==========================================
@app.get("/api/v1/alerts")
def get_alerts(
    farm_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
):
    conn = get_db()
    cursor = conn.cursor()

    query = """
    SELECT a.id, a.farm_id, a.zone_id, z.name as zone_name, a.device_id,
           a.metric, a.severity, a.message, a.status, a.note, a.created_at
    FROM alerts a
    LEFT JOIN zones z ON a.zone_id = z.id
    WHERE 1=1
    """
    params = []
    if farm_id:
        query += " AND a.farm_id = ?"
        params.append(farm_id)
    if status:
        query += " AND a.status = ?"
        params.append(status)

    query += " ORDER BY a.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) FROM alerts")
    total = cursor.fetchone()[0]
    conn.close()

    res = [dict(r) for r in rows]
    return {
        "success": True,
        "data": res,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit,
        },
    }


@app.post("/api/v1/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, req: AlertAckRequest):
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute(
        "UPDATE alerts SET status = 'ACKNOWLEDGED', note = ?, resolved_at = ? WHERE id = ?",
        (req.note, now_iso, alert_id),
    )
    conn.commit()

    log_audit(
        1,
        "Quản Trị Viên (Owner)",
        "ADMIN",
        "ALERT_ACK",
        f"Xác nhận xử lý sự cố #{alert_id}",
        req.note,
    )
    conn.close()
    return {"success": True, "message": "Đã xác nhận xử lý cảnh báo"}


# ==========================================
# 6. Reports & Analytics Module (SCR-06 | UC-12, G9)
# ==========================================
@app.get("/api/v1/reports/analytics")
def get_report_analytics(farm_id: Optional[int] = None, zone_id: Optional[int] = None):
    conn = get_db()
    cursor = conn.cursor()

    zid = zone_id if zone_id else 1
    cursor.execute(
        """
    SELECT strftime('%Y-%m-%d %H:00:00', recorded_at) as hour_bucket,
           AVG(CASE WHEN metric = 'TEMP' THEN value END) as avg_temp,
           AVG(CASE WHEN metric = 'HUMI' THEN value END) as avg_humi,
           AVG(CASE WHEN metric = 'SOIL' THEN value END) as avg_soil
    FROM telemetry
    WHERE zone_id = ?
    GROUP BY hour_bucket
    ORDER BY hour_bucket DESC
    LIMIT 24
    """,
        (zid,),
    )
    rows = cursor.fetchall()
    conn.close()

    series = []
    for r in reversed(rows):
        series.append(
            {
                "timestamp": r["hour_bucket"],
                "avg_temp": round(r["avg_temp"], 1) if r["avg_temp"] else 22.0,
                "avg_humi": round(r["avg_humi"], 1) if r["avg_humi"] else 70.0,
                "avg_soil": round(r["avg_soil"], 1) if r["avg_soil"] else 55.0,
                "pump_active_minutes": 20,
            }
        )

    return {
        "success": True,
        "data": {
            "summary": {
                "total_operational_hours": 168.0,
                "optimal_condition_rate": 96.2,
                "total_water_liters": 1420.0,
            },
            "series": series,
        },
    }


@app.get("/api/v1/reports/export")
def export_report(format: str = "csv", zone_id: Optional[int] = 1):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
    SELECT recorded_at, metric, value
    FROM telemetry
    WHERE zone_id = ?
    ORDER BY recorded_at DESC LIMIT 500
    """,
        (zone_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Timestamp", "Metric", "Value"])
        for r in rows:
            writer.writerow([r["recorded_at"], r["metric"], r["value"]])
        csv_bytes = output.getvalue().encode("utf-8-sig")
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="smartfarm_report.csv"'},
        )
    else:
        # Default fallback to CSV text
        return Response(
            content="Chức năng xuất định dạng nâng cao",
            media_type="text/plain",
        )


# ==========================================
# 7. Audit Log Module (SCR-07 | UC-05, G7)
# ==========================================
@app.get("/api/v1/audit-logs")
def get_audit_logs(
    page: int = 1,
    limit: int = 20,
    event_type: Optional[str] = None,
):
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM audit_logs WHERE 1=1"
    params = []
    if event_type:
        query += " AND event_type = ?"
        params.append(event_type)

    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) FROM audit_logs")
    total = cursor.fetchone()[0]
    conn.close()

    return {
        "success": True,
        "data": [dict(r) for r in rows],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit,
        },
    }


# ==========================================
# 8. User Management Module (SCR-08 | UC-02, UC-03, G8)
# ==========================================
@app.get("/api/v1/users")
def get_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, role, is_active, created_at FROM users")
    users = cursor.fetchall()
    conn.close()
    return {"success": True, "data": [dict(u) for u in users]}


@app.post("/api/v1/users")
def create_user(req: UserCreateRequest):
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        cursor.execute(
            """
        INSERT INTO users (email, password_hash, full_name, role, is_active, created_at)
        VALUES (?, ?, ?, ?, 1, ?)
        """,
            (req.email, hash_password(req.password), req.full_name, req.role, now_iso),
        )
        user_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail="Email đã tồn tại trong hệ thống")

    conn.close()
    return {"success": True, "data": {"id": user_id}, "message": "Tạo người dùng thành công"}


# ==========================================
# 9. Farm & Zone Module (SCR-09 | UC-04, G2)
# ==========================================
@app.get("/api/v1/farms")
def get_farms():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, location, total_area, created_at FROM farms")
    farms = cursor.fetchall()
    conn.close()
    return {"success": True, "data": [dict(f) for f in farms]}


@app.get("/api/v1/farms/{farm_id}/zones")
def get_farm_zones(farm_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
    SELECT z.id, z.farm_id, z.name, z.crop_type, z.area_m2, z.description,
           COUNT(d.id) as device_count
    FROM zones z
    LEFT JOIN devices d ON z.id = d.zone_id
    WHERE z.farm_id = ?
    GROUP BY z.id
    """,
        (farm_id,),
    )
    zones = cursor.fetchall()
    conn.close()
    return {"success": True, "data": [dict(z) for z in zones]}


@app.post("/api/v1/farms/{farm_id}/zones")
def create_zone(farm_id: int, req: ZoneCreateRequest):
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute(
        """
    INSERT INTO zones (farm_id, name, crop_type, area_m2, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """,
        (farm_id, req.name, req.crop_type, req.area_m2, req.description, now_iso),
    )
    zid = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"success": True, "data": {"id": zid}, "message": "Tạo khu vực canh tác thành công"}


# ==========================================
# 10. Device Inventory Module (SCR-10 | UC-13, G3)
# ==========================================
@app.get("/api/v1/devices")
def get_devices(zone_id: Optional[int] = None, type: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT id, hardware_uid, name, type, metrics_json, zone_id, status, is_simulated, created_at FROM devices WHERE 1=1"
    params = []
    if zone_id:
        query += " AND zone_id = ?"
        params.append(zone_id)
    if type:
        query += " AND type = ?"
        params.append(type)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    res = []
    for r in rows:
        d = dict(r)
        d["metrics"] = json.loads(d.pop("metrics_json"))
        res.append(d)
    return {"success": True, "data": res}


@app.post("/api/v1/devices")
def create_device(req: DeviceCreateRequest):
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        cursor.execute(
            """
        INSERT INTO devices (hardware_uid, name, type, metrics_json, zone_id, status, is_simulated, created_at)
        VALUES (?, ?, ?, ?, ?, 'ONLINE', ?, ?)
        """,
            (
                req.hardware_uid,
                req.name,
                req.type,
                json.dumps(req.metrics),
                req.zone_id,
                int(req.is_simulated),
                now_iso,
            ),
        )
        dev_id = cursor.lastrowid
        if req.type == "ACTUATOR":
            cursor.execute(
                "INSERT INTO actuator_states (device_id, state, mode, last_action_at) VALUES (?, 'OFF', 'AUTO', ?)",
                (dev_id, now_iso),
            )
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Không thể tạo thiết bị: {e}")

    conn.close()
    return {"success": True, "data": {"id": dev_id}, "message": "Đăng ký thiết bị thành công"}
