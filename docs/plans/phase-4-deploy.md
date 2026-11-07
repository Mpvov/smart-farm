# Kế hoạch thực thi Bước 4: CI/CD & Deploy

Tài liệu đặc tả chi tiết kế hoạch kỹ thuật cho Bước 4 (CI/CD & Deploy hệ thống Smart Farm) theo lộ trình tại `docs/PROGRESS.md`. Kế hoạch kết hợp kiến trúc tối giản (Ponytail Ultra), không thêm thư viện ngoài (tuân thủ Luật cứng AGENTS.md), bảo mật theo NFR-04 và thực hiện theo phương pháp TDD.

---

## 1. Mục tiêu và Kiến trúc

1. **Kiến trúc Deploy: Monolith 1 Container trên Render.com (Free Web Service)**
   - **Đặc thù kỹ thuật:** Hệ thống sở hữu vòng lặp giả lập vi khí hậu nền (`simulator.start()`) và luồng Server-Sent Events realtime stream (`/api/v1/stream/realtime`). Các nền tảng Serverless tĩnh/functions (Vercel/Netlify functions) sẽ bị ngắt kết nối do giới hạn execution timeout (10s - 60s) và không duy trì được background loop. Do đó bắt buộc triển khai dạng persistent container.
   - **Mô hình Monolith 1 Container:** Multi-stage build đóng gói cả giao diện Frontend (`frontend/dist`) và máy chủ Backend (`backend/main.py`).
   - **Phục vụ đồng thời:** REST API (`/api/v1/*`), SSE stream (`/api/v1/stream/realtime`), Swagger UI (`/docs`), và Single Page Application tĩnh (`/assets/*`, fallback `index.html`).
   - **Lợi ích:** 1 domain duy nhất, triệt tiêu hoàn toàn lỗi CORS và đứt kết nối stream SSE, chi phí 0đ, tự động re-deploy từ GitHub.

2. **Bảo mật & Rate Limit (NFR-04):**
   - **YAGNI & Ponytail Ultra:** Không cài đặt thêm thư viện ngoài (không dùng Redis hay slowapi) để giữ hệ thống nhẹ và không phát sinh ADR mới.
   - **Cơ chế:** Viết middleware Starlette thuần Python (`collections.defaultdict` + sliding-window 60s) gắn trực tiếp trong `backend/main.py`.
   - **Giới hạn tần suất:**
     - `POST /api/v1/auth/login`: Tối đa 5 lượt gọi / 60 giây theo IP client (chống brute-force dò mật khẩu). Vượt ngưỡng trả về HTTP `429 Too Many Requests`.
     - Các endpoint `/api/*` khác: Tối đa 120 lượt gọi / 60 giây theo IP client. Bỏ qua không giới hạn cho luồng SSE `/api/v1/stream/realtime`.
   - **HTTP Security Headers chuẩn:**
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY`
     - `Referrer-Policy: strict-origin-when-cross-origin`

3. **CI/CD Tự động:**
   - Pipeline GitHub Actions (`.github/workflows/ci.yml`) tự động kích hoạt trên pull request và nhánh `main`.
   - Chạy toàn bộ kiểm thử hợp đồng dữ liệu UART/MQTT/API, kiểm thử hồi quy backend, và kiểm tra build frontend.

---

## 2. Kế hoạch thực thi chi tiết (Dành cho Worker Flash — Ponytail Ultra + TDD)

### 1. Tạo branch từ main
```powershell
git switch -c feat/deploy-and-security main
```

### 2. Cập nhật tài liệu (`docs/REQUIREMENTS.md` & `docs/PROGRESS.md`)
- Trong `docs/REQUIREMENTS.md`, bổ sung vào cuối đoạn `NFR-04`:
  `..., giới hạn tần suất (rate limit) chống dò mật khẩu và gắn HTTP security headers.`
- Trong `docs/PROGRESS.md`, đánh dấu:
  `- [x] **Bước 4 — CI/CD & Web Deployment thật:**`

### 3. Viết test trước (TDD) trong `backend/test_backend.py`
- Thêm hàm `test_rate_limit_and_security_headers()` ở cuối file (dùng `X-Forwarded-For: 198.51.100.77` để cô lập IP với các test khác):
```python
def test_rate_limit_and_security_headers():
    ip_headers = {"X-Forwarded-For": "198.51.100.77"}
    for _ in range(5):
        r = client.post("/api/v1/auth/login", json={"email": "a@b.c", "password": "x"}, headers=ip_headers)
        assert r.status_code == 401
        assert r.headers.get("X-Content-Type-Options") == "nosniff"
        assert r.headers.get("X-Frame-Options") == "DENY"
    r6 = client.post("/api/v1/auth/login", json={"email": "a@b.c", "password": "x"}, headers=ip_headers)
    assert r6.status_code == 429
```
- Chạy lệnh kiểm thử để xác nhận test đỏ (Red):
```powershell
python -m pytest backend -q
```

### 4. Thêm Rate Limit + Security Headers + Static SPA trong `backend/main.py`
- Import thêm ở đầu file:
```python
import os
import time
from collections import defaultdict
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
```
- Ngay dưới `app.add_middleware(CORSMiddleware, ...)`, thêm middleware thuần Python:
```python
_rate_buckets: Dict[str, List[float]] = defaultdict(list)

@app.middleware("http")
async def security_and_rate_limit(request: Request, call_next):
    path = request.url.path
    if path.startswith("/api/") and path != "/api/v1/stream/realtime":
        ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (
            request.client.host if request.client else "unknown"
        )
        is_login = path == "/api/v1/auth/login" and request.method == "POST"
        key = f"{ip}:{'login' if is_login else 'api'}"
        limit = 5 if is_login else 120
        now = time.monotonic()
        bucket = [t for t in _rate_buckets[key] if now - t < 60.0]
        if len(bucket) >= limit:
            _rate_buckets[key] = bucket
            return JSONResponse(status_code=429, content={"detail": "Too Many Requests"})
        bucket.append(now)
        _rate_buckets[key] = bucket
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```
- Ở cuối file `backend/main.py`, mount `frontend/dist` nếu tồn tại:
```python
_DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(_DIST_DIR):
    _ASSETS_DIR = os.path.join(_DIST_DIR, "assets")
    if os.path.isdir(_ASSETS_DIR):
        app.mount("/assets", StaticFiles(directory=_ASSETS_DIR), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = os.path.join(_DIST_DIR, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(_DIST_DIR, "index.html"))
```

### 5. Tạo cấu hình Deploy & CI/CD ở gốc repo (không tạo thư mục mới ngoài `.github/`)
- **`Dockerfile`:** Multi-stage:
  - Base `node:20-alpine`: build `frontend/` (`npm ci && npm run build`).
  - Base `python:3.12-slim`: cài `backend/requirements.txt`, copy `backend/`, `contracts/`, `frontend/dist`, chạy `uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}`.
- **`.dockerignore`:** Bỏ qua `node_modules`, `.git`, `.venv`, `venv`, `__pycache__`, `*.db`.
- **`render.yaml`:** Khai báo 1 Web Service `env: docker`, `plan: free`, `healthCheckPath: /docs`.
- **`.github/workflows/ci.yml`:** Chạy trên `ubuntu-latest` kiểm tra `pytest`, `contracts/test_contracts.py`, `contracts/test_api_contracts.py` và `npm --prefix frontend run build`.

### 6. Kiểm tra, Commit & Merge vào `D:/DADN`
- Chạy cổng kiểm tra:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check.ps1
```
(Yêu cầu: exit 0).
- Commit:
```text
feat(backend): NFR-04 rate limit, security headers, static mount and deploy config
```
- Kiểm tra kho gốc và merge fast-forward:
```powershell
git -C D:/DADN status --short
# Nếu rỗng:
git -C D:/DADN merge --ff-only feat/deploy-and-security
```
