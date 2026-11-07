# REST API & Realtime SSE Contract

Quy chuẩn giao tiếp giữa Frontend (React Vite Dashboard) và Backend (Python FastAPI).
Base URL: `/api/v1`

---

## 1. QUY ƯỚC CHUNG

1. **Format dữ liệu:** `application/json` (UTF-8).
2. **Xác thực (Authentication):** Header `Authorization: Bearer <access_token>`.
3. **Cơ chế Realtime Streaming:** Sử dụng Server-Sent Events (SSE) với header `Accept: text/event-stream`.
4. **Định dạng phản hồi chuẩn:**
   - Thành công: `{ "success": true, "data": { ... }, "message": "..." }`
   - Phân trang: `{ "success": true, "data": [ ... ], "pagination": { "page": 1, "limit": 20, "total": 150, "total_pages": 8 } }`
   - Thất bại: `{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }`

---

## 2. DANH MỤC ENDPOINTS THEO MÀN HÌNH & USE CASE

### 2.1. Xác thực & Tài khoản (`SCR-01` | `UC-01`)

* **`POST /auth/login`**
  - **Mô tả:** Đăng nhập hệ thống, cấp JWT token.
  - **Request:** `{ "email": "admin@smartfarm.vn", "password": "secure_password" }`
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "access_token": "eyJhbGciOi...",
        "token_type": "bearer",
        "user": {
          "id": 1,
          "email": "admin@smartfarm.vn",
          "full_name": "Nguyen Van A",
          "role": "ADMIN"
        }
      }
    }
    ```
* **`GET /auth/me`**
  - **Mô tả:** Lấy thông tin phiên đăng nhập hiện tại.
  - **Response (200):** Trả về thông tin `user` như trên.
* **`POST /auth/logout`**
  - **Mô tả:** Đăng xuất và hủy phiên làm việc.

---

### 2.2. Giám sát Thời gian thực & Live Dashboard (`SCR-02` | `UC-06`, Gate G1, G3)

* **`GET /dashboard/summary?farm_id={farm_id}`**
  - **Mô tả:** Thẻ KPI tổng quan toàn farm (tổng Zone, thiết bị Online/Offline, số cảnh báo chưa xử lý).
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "farm_id": 1,
        "farm_name": "Trang trại Đà Lạt 1",
        "total_zones": 4,
        "total_devices": 16,
        "devices_online": 15,
        "active_alerts_count": 2
      }
    }
    ```

* **`GET /zones/{zone_id}/telemetry/latest`**
  - **Mô tả:** Lấy chỉ số mới nhất của toàn bộ cảm biến thuộc 1 Zone.
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "zone_id": 1,
        "zone_name": "Khu A - Dâu tây",
        "crop_type": "Dâu tây New Zealand",
        "updated_at": "2026-11-07T21:00:00Z",
        "metrics": {
          "TEMP": { "value": 24.5, "unit": "°C", "status": "NORMAL" },
          "HUMI": { "value": 72.0, "unit": "%", "status": "NORMAL" },
          "SOIL": { "value": 38.2, "unit": "%", "status": "WARNING_LOW" },
          "LIGHT": { "value": 1850.0, "unit": "Lux", "status": "NORMAL" }
        }
      }
    }
    ```

* **`GET /zones/{zone_id}/telemetry/history?metric={TEMP|HUMI|SOIL|LIGHT}&range={24h|7d}`**
  - **Mô tả:** Dữ liệu chuỗi thời gian vẽ mini-chart xu hướng 24h trên Dashboard.
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": [
        { "timestamp": "2026-11-07T00:00:00Z", "value": 21.2 },
        { "timestamp": "2026-11-07T01:00:00Z", "value": 20.8 }
      ]
    }
    ```

* **`GET /zones/{zone_id}/telemetry/stream` (SSE Realtime)**
  - **Mô tả:** Stream Server-Sent Events đẩy dữ liệu vi khí hậu mỗi khi có số đo mới (tần suất ~5-10s).
  - **SSE Format:**
    ```text
    event: telemetry
    data: {"zone_id": 1, "metric": "SOIL", "value": 37.9, "timestamp": "2026-11-07T21:00:10Z"}
    ```

---

### 2.3. Điều khiển Thiết bị & Trạng thái (`SCR-03` | `UC-07`, `UC-08`, Gate G3)

* **`GET /zones/{zone_id}/actuators`**
  - **Mô tả:** Lấy danh sách cơ cấu chấp hành (bơm, van, đèn...) trong 1 Zone.
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": [
        {
          "device_id": 101,
          "device_code": "PUMP-Z1-01",
          "name": "Bơm tưới gốc Zone 1",
          "type": "ACTUATOR",
          "metric": "PUMP",
          "state": "OFF",
          "mode": "AUTO",
          "status": "ONLINE",
          "last_action_at": "2026-11-07T18:30:00Z"
        }
      ]
    }
    ```

* **`POST /devices/{device_id}/control`**
  - **Mô tả:** Điều khiển bật/tắt thủ công tức thời (yêu cầu phản hồi < 2s).
  - **Request:** `{ "action": "ON", "duration_minutes": 15 }`
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "device_id": 101,
        "new_state": "ON",
        "executed_at": "2026-11-07T21:05:00Z",
        "ack_status": "SUCCESS"
      },
      "message": "Đã gửi lệnh bật thiết bị thành công"
    }
    ```

---

### 2.4. Cấu hình Ngưỡng & Lập lịch Trình (`SCR-04` | `UC-09`, `UC-10`, Gate G4, G5)

* **`GET /zones/{zone_id}/thresholds`**
  - **Mô tả:** Lấy bộ cấu hình ngưỡng an toàn và hành động tự động đi kèm của Zone.
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "zone_id": 1,
          "metric": "SOIL",
          "warning_min": 40.0,
          "warning_max": 80.0,
          "danger_min": 30.0,
          "danger_max": 90.0,
          "auto_actions": [
            { "trigger": "BELOW_DANGER_MIN", "target_device_id": 101, "action": "ON" }
          ]
        }
      ]
    }
    ```

* **`PUT /zones/{zone_id}/thresholds` (Apply Config Realtime)**
  - **Mô tả:** Cập nhật ngưỡng an toàn; Backend đồng bộ tức thời (Realtime Sync) xuống thiết bị chấp hành.
  - **Request:** Mảng các ngưỡng cần lưu.
  - **Response (200):** `{ "success": true, "message": "Đã áp dụng cấu hình ngưỡng mới thành công" }`

* **`GET /zones/{zone_id}/schedules`**
  - **Mô tả:** Lấy danh sách lịch trình tự động của Zone.
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 12,
          "zone_id": 1,
          "device_id": 101,
          "device_name": "Bơm tưới gốc Zone 1",
          "start_time": "06:30",
          "duration_minutes": 20,
          "days_of_week": [1, 2, 3, 4, 5, 6, 7],
          "is_active": true
        }
      ]
    }
    ```

* **`POST /zones/{zone_id}/schedules`**
  - **Mô tả:** Tạo mới lịch trình vận hành.
* **`PUT /schedules/{schedule_id}`** / **`DELETE /schedules/{schedule_id}`**

---

### 2.5. Trung tâm Cảnh báo & Sự cố (`SCR-05` | `UC-11`, Gate G6)

* **`GET /alerts?farm_id={farm_id}&status={UNACKNOWLEDGED|RESOLVED}&severity={CRITICAL|WARNING}&page=1&limit=20`**
  - **Mô tả:** Danh sách cảnh báo sự cố vi phạm ngưỡng hoặc mất kết nối thiết bị.
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 501,
          "farm_id": 1,
          "zone_id": 1,
          "zone_name": "Khu A - Dâu tây",
          "device_id": 201,
          "metric": "SOIL",
          "severity": "CRITICAL",
          "message": "Độ ẩm đất giảm sâu dưới 30% (hiện tại 28.4%)",
          "status": "UNACKNOWLEDGED",
          "created_at": "2026-11-07T20:55:00Z"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1 }
    }
    ```

* **`POST /alerts/{alert_id}/acknowledge`**
  - **Mô tả:** Người vận hành xác nhận đã tiếp nhận và xử lý sự cố.
  - **Request:** `{ "note": "Đã kiểm tra đường ống và cho bơm nước bù" }`
  - **Response (200):** `{ "success": true, "message": "Đã xác nhận xử lý cảnh báo" }`

---

### 2.6. Báo cáo Động & Xuất Dữ liệu HTTT (`SCR-06` | `UC-12`, Gate G9)

* **`GET /reports/analytics?farm_id={}&zone_id={}&crop_type={}&from={}&to={}&interval={1h|1d}`**
  - **Mô tả:** Trả về số liệu chuỗi thời gian đa chiều, tổng hợp Min/Max/Avg và tỷ lệ thời gian môi trường đạt chuẩn.
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "summary": {
          "total_operational_hours": 168.0,
          "optimal_condition_rate": 94.5,
          "total_water_liters": 1250.0
        },
        "series": [
          {
            "timestamp": "2026-11-07T00:00:00Z",
            "avg_temp": 22.4,
            "avg_soil": 65.2,
            "pump_active_minutes": 30
          }
        ]
      }
    }
    ```

* **`GET /reports/export?format={xlsx|csv}&farm_id={}&zone_id={}&from={}&to={}`**
  - **Mô tả:** Tải tệp tin báo cáo tổng hợp dữ liệu (Excel .xlsx hoặc CSV).
  - **Response (200):** Tệp tin nhị phân kèm header `Content-Disposition: attachment; filename="report_farm1_20261107.xlsx"`.

---

### 2.7. Nhật ký Hoạt động Audit Log (`SCR-07` | `UC-05`, Gate G7)

* **`GET /audit-logs?farm_id={}&zone_id={}&user_id={}&event_type={}&from={}&to={}&page=1&limit=20`**
  - **Mô tả:** Tra cứu nhật ký bất biến ghi nhận mọi can thiệp hệ thống.
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 9001,
          "timestamp": "2026-11-07T21:05:00Z",
          "user_id": 1,
          "user_name": "Nguyen Van A",
          "role": "ADMIN",
          "event_type": "DEVICE_CONTROL",
          "farm_name": "Trang trại Đà Lạt 1",
          "zone_name": "Khu A - Dâu tây",
          "device_name": "Bơm tưới gốc Zone 1",
          "action": "Bật máy bơm thủ công",
          "details": "Chuyển trạng thái từ OFF -> ON (thời lượng 15 phút)",
          "ip_address": "192.168.1.10"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 120, "total_pages": 6 }
    }
    ```

---

### 2.8. Quản trị Người dùng & Phân quyền RBAC (`SCR-08` | `UC-02`, `UC-03`, Gate G8)

* **`GET /users?page=1&limit=20`**
  - **Mô tả:** Danh sách tài khoản trong hệ thống.
* **`POST /users`**
  - **Mô tả:** Admin tạo tài khoản mới (Operator hoặc Admin trang trại khác).
  - **Request:** `{ "email": "op1@smartfarm.vn", "full_name": "Tran Van B", "password": "...", "role": "OPERATOR", "assigned_farm_ids": [1] }`
* **`PUT /users/{user_id}`** (Cập nhật role, họ tên, farm phân công).
* **`PATCH /users/{user_id}/status`** (Khóa/mở khóa tài khoản: `{ "is_active": false }`).

---

### 2.9. Quản trị Nông trại & Phân khu Canh tác (`SCR-09` | `UC-04`, Gate G2)

* **`GET /farms`** / **`POST /farms`** / **`PUT /farms/{farm_id}`** / **`DELETE /farms/{farm_id}`**
  - **Mô tả:** Quản lý Nông trại của chủ sở hữu.
* **`GET /farms/{farm_id}/zones`**
  - **Mô tả:** Danh sách các Zone trực thuộc 1 Nông trại.
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "farm_id": 1,
          "name": "Khu A - Dâu tây",
          "area_m2": 500.0,
          "crop_type": "Dâu tây New Zealand",
          "description": "Khu trồng ngoài trời luống cao phủ màng nông nghiệp",
          "device_count": 5
        }
      ]
    }
    ```
* **`POST /farms/{farm_id}/zones`** / **`PUT /zones/{zone_id}`** / **`DELETE /zones/{zone_id}`**

---

### 2.10. Quản lý Danh mục Thiết bị Động (`SCR-10` | `UC-13`, Gate G3)

* **`GET /devices?farm_id={}&zone_id={}&type={SENSOR|ACTUATOR}`**
  - **Mô tả:** Danh mục thiết bị động đã khai báo trong hệ thống.
  - **Response (200):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 201,
          "hardware_uid": "DHT20-Z1-01",
          "name": "Cảm biến vi khí hậu Zone 1",
          "type": "SENSOR",
          "metrics": ["TEMP", "HUMI"],
          "zone_id": 1,
          "status": "ONLINE",
          "is_simulated": false
        }
      ]
    }
    ```
* **`POST /devices`**
  - **Mô tả:** Khai báo thiết bị mới, gán vào Zone (hỗ trợ cắm cờ `is_simulated: true` cho thiết bị giả lập).
* **`PUT /devices/{device_id}`** (Chuyển Zone, đổi tên, cấu hình thông số).
* **`DELETE /devices/{device_id}`** (Hủy đăng ký thiết bị).
