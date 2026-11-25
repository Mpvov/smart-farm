# TIẾN ĐỘ THỰC HIỆN DỰ ÁN (PROJECT PROGRESS)

---

## 1. MỤC TIÊU GIỮA KỲ & YÊU CẦU NGHIỆM THU CỦA GIẢNG VIÊN

Theo thông báo nộp báo cáo giữa kỳ và mốc Tuần 46 trong `docs/sources/timeline.pdf`, nhóm phải hoàn thành 2 sản phẩm nộp lên LMS (**không gửi video sẽ nhận 0 điểm phần báo cáo giữa kỳ**):

1. **Video Demo (1 file duy nhất, thời lượng ≤ 5 phút):**
   - Quay trực tiếp trên **1 file video duy nhất**, thể hiện đầy đủ: thiết bị phần cứng thật, ứng dụng (Web/Mobile), phần trình bày và luồng kết nối xuyên suốt:
     **Thao tác tắt/mở thiết bị → Trạng thái thay đổi trên Adafruit IO (hoặc Broker tương tự) → Trạng thái thay đổi trên ứng dụng Mobile / Web.**
   - Đáp ứng tối thiểu Module 1 (nhận dữ liệu cảm biến đầu vào từ mạch thật lên Broker và ứng dụng) theo mốc Tuần 46 trong `docs/sources/timeline.pdf`, kèm chiều điều khiển thiết bị nếu hoàn thiện 2 chiều.
2. **Báo cáo giai đoạn giữa kỳ (`report/`):**
   - Cập nhật đầy đủ nội dung tới giai đoạn giữa kỳ (UR/FR/UC, UI/UX, thiết kế CSDL ERD, kiến trúc kết nối thiết bị) và **đính kèm link video đã upload**.

### Phân định phạm vi (Scope) tới giữa kỳ

- **P (Phạm vi đến giữa kỳ: chỉ UI/UX — đã hoàn thành vượt mốc):**
  - Đã hoàn thiện 10 màn hình Responsive Web (`SCR-01` → `SCR-10`), đặc tả API (`contracts/api.md`), Backend prototype + Simulator chạy thật và pipeline CI/CD (`docs/plans/phase-4-deploy.md`).
  - **Phần kết nối thiết bị thật ↔ Adafruit IO ↔ Backend/App nằm ngoài phạm vi của P.** P chỉ hỗ trợ bàn giao UI/API contract và bổ sung cơ chế cập nhật hiển thị phía Frontend (`SCR-03`) khi nhóm chốt định dạng dữ liệu đồng bộ.
- **N, Q:** Phụ trách phần cứng Yolo:Bit (`firmware/`), Python Gateway (`gateway/`) và kết nối Adafruit IO theo `contracts/uart.md` và `contracts/mqtt.md`.
- **H:** Đồng phụ trách Báo cáo giữa kỳ (`report/`), thiết kế ERD, kiểm duyệt/nộp bài và điều phối kịch bản quay video.
- **Điểm trống trách nhiệm (cần chốt ngay):** Cầu nối **Adafruit IO (MQTT Broker) ↔ Backend (`backend/main.py`)** hiện chưa có người nhận do nằm ngoài phạm vi UI/UX của P.

---

## 2. NHỮNG THỨ CẦN CHỐT NGAY TRƯỚC KHI TRIỂN KHAI & QUAY DEMO

| STT | Hạng mục cần chốt | Nội dung / Phương án đề xuất | Tham chiếu | Ai chốt |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Chủ sở hữu cầu nối Broker ↔ Backend** | Chốt thành viên (N, Q hoặc H) phụ trách viết MQTT Worker trong `backend/main.py` (subscribe feeds từ Broker vào SQLite + publish lệnh từ `POST /api/v1/devices/{device_id}/control` ra Broker). Nếu bỏ trống khâu này, App và Adafruit IO không đồng bộ được trạng thái. | `docs/ARCHITECTURE.md` | Cả nhóm |
| 2 | **Broker & tài khoản dùng chung (`OQ-Broker`)** | Chốt dùng **Adafruit IO** cho demo giữa kỳ (khớp yêu cầu giảng viên *"trạng thái thay đổi trên adafruit hoặc tương tự"*, có sẵn Dashboard trực quan để quay). Dùng 1 tài khoản AIO chung, tạo đủ 5 feeds (`smartfarm-temp`, `smartfarm-humi`, `smartfarm-soil`, `smartfarm-pump`, `smartfarm-led`), đặt chu kỳ gửi cảm biến ≥ 15–30s để tránh chạm trần 30 điểm/phút của Free Tier; chia sẻ `AIO_USERNAME`/`AIO_KEY` qua kênh riêng (không commit `.env`). | `contracts/mqtt.md` | N, Q, H |
| 3 | **Phần cứng PoC, kiểu kết nối (`OQ-Link`) & thao tác tắt/mở** | - Chốt kiểu nối mạch: **USB-UART + Python Gateway** (`contracts/uart.md`, khuyến nghị vì đã có test contract) hay Wi-Fi trực tiếp trên Yolo:Bit.<br>- Chốt bộ thiết bị PoC (tối thiểu 2 Input + 2 Output theo Tuần 39 `docs/sources/timeline.pdf`): đề xuất Input = DHT20 (`TEMP`, `HUMI`) + Độ ẩm đất (`SOIL`); Output = Relay Bơm/Quạt (`PUMP`) + Đèn 4 LED RGB (`LED`) + LCD 16x2 (`FR-FW-01`).<br>- **Chốt thao tác tắt/mở từ phía thiết bị thật** (nút A/B trên Yolo:Bit hoặc Remote IR + mắt đọc hồng ngoại trong kit) để kích hoạt luồng *thiết bị → Adafruit IO → Web/Mobile App*, kèm **chống echo loop** (tránh Gateway nhận lại trạng thái tự gửi). Nếu thêm bản tin mới, phải cập nhật `contracts/uart.md`, `contracts/mqtt.md`, `contracts/samples/` và test trong cùng commit. | `contracts/uart.md`, `docs/KNOWLEDGE.md` | N, Q |
| 4 | **Môi trường Demo & cơ chế cập nhật `SCR-03`** | - Chốt chạy Demo **Local** (1 laptop chạy `gateway/` + `backend/main.py` + trình duyệt Web/Mobile, ổn định 100%, không lo Render Free Tier ngủ đông) hoặc chạy trên **Web Deploy Render** (cần cấu hình `AIO_USERNAME`/`AIO_KEY` và khởi động trước lúc quay).<br>- **Lưu ý kỹ thuật cho `SCR-03`:** Hiện `frontend/src/components/screens/DeviceControlScreen.tsx` chỉ tải `GET /zones/{zone_id}/actuators` lúc mở trang hoặc sau khi bấm nút trên Web, chưa tự cập nhật khi thiết bị đổi trạng thái từ ngoài App. Cần chốt dùng **SSE event mới** (mở rộng `GET /zones/{zone_id}/telemetry/stream`) hay **polling 1–2s** để `SCR-03` tự đổi trạng thái không cần tải lại trang. | `contracts/api.md`, `docs/plans/phase-4-deploy.md` | Người làm cầu nối + P |
| 5 | **Chuẩn hóa CSDL (ERD) & cấu trúc Báo cáo giữa kỳ** | Hiện `report/section/` mới có `Introduction.tex`, `Device.tex`, `UserRequirement.tex`, `UseCase.tex`. Cần chốt dùng schema hiện hành trong `backend/database.py` (SQLite) làm chuẩn vẽ sơ đồ ERD cho báo cáo giữa kỳ để khớp code chạy thật, đồng thời bổ sung chương Giao diện (`SCR-01` → `SCR-10`), CSDL (ERD), Kiến trúc kết nối thiết bị và mục Link Video Demo. | `backend/database.py`, `report/` | H, P |
| 6 | **Kịch bản Video (≤ 5 phút) & kênh upload** | Chốt người quay, người thuyết minh, bố cục khung hình (chia khung hoặc Picture-in-Picture hiển thị đồng thời mạch thật + Adafruit IO Dashboard + Web/Mobile App trong 1 video liên tục, hạn chế cắt ghép). Chốt kênh upload (YouTube Unlisted hoặc Google Drive công khai quyền xem) và kiểm tra mở link ở chế độ ẩn danh trước khi nộp. | `docs/sources/timeline.pdf` | Cả nhóm |

---

## 3. VIỆC CẦN LÀM CỦA TỪNG THÀNH VIÊN ĐỂ ĐẠT YÊU CẦU GIỮA KỲ

### N & Q — Phần cứng, Gateway & Kết nối Adafruit IO (`firmware/`, `gateway/`)
- [ ] **Lắp đặt bộ kit Yolo:Bit PoC:** Đấu nối tối thiểu 2 cảm biến Input (DHT20, độ ẩm đất) + 2 Output (Relay bơm/quạt, đèn 4 LED RGB) + màn hình LCD 16x2 + cơ chế nút nhấn/Remote IR để thao tác tắt/mở tại thiết bị.
- [ ] **Hoàn thiện Firmware (`firmware/` — `FR-FW-01`):** Đọc cảm biến định kỳ, hiển thị thông số lên LCD 16x2, đóng/ngắt Relay/LED và giao tiếp UART `115200 bps` đúng định dạng `!1:KEY:VALUE#` theo `contracts/uart.md`; khi người dùng tắt/mở trực tiếp trên thiết bị thì cập nhật trạng thái phần cứng và gửi gói trạng thái mới lên UART.
- [ ] **Cấu hình Adafruit IO:** Tạo tài khoản dùng chung, tạo 5 feeds (`smartfarm-temp`, `smartfarm-humi`, `smartfarm-soil`, `smartfarm-pump`, `smartfarm-led`) và Dashboard hiển thị trực quan trạng thái bật/tắt + giá trị cảm biến để phục vụ quay video.
- [ ] **Hoàn thiện Python Gateway (`gateway/` — `FR-GW-02`, `FR-GW-03`, `FR-GW-04`, `NFR-03`):** Viết cầu nối 2 chiều `pyserial` ↔ `paho-mqtt`, nạp biến môi trường từ `.env` (kèm `.env.example` chỉ chứa tên biến), lọc nhiễu dữ liệu, chống echo loop, tự ngắt bơm theo timeout an toàn; đảm bảo vượt qua `contracts/test_contracts.py` và `scripts/check.ps1`.
- [ ] **Kiểm chứng chặng Thiết bị → Adafruit IO:** Thao tác tắt/mở trực tiếp trên thiết bị thật → xác nhận trạng thái trên Adafruit IO Dashboard thay đổi trong ≤ 2s (`NFR-01`), và tác động cảm biến → số liệu trên Adafruit IO cập nhật đúng.

### Thành viên phụ trách Cầu nối Adafruit IO ↔ Backend *(Cần chốt giữa N, Q, H — ngoài scope P)*
- [ ] **Tích hợp MQTT Worker trong `backend/main.py`:** Chạy worker `paho-mqtt` trong `lifespan` (có biến môi trường bật/tắt để không ảnh hưởng bộ test pytest offline và giữ nguyên simulator cho các Zone khác):
  - Subscribe feeds cảm biến (`smartfarm-temp`, `smartfarm-humi`, `smartfarm-soil`) → lưu bảng `telemetry` cho Zone PoC (Zone 1) và đẩy vào luồng SSE lên `SCR-02` (`FR-FE-01`).
  - Subscribe feeds chấp hành (`smartfarm-pump`, `smartfarm-led`) → cập nhật bảng `actuator_states`, ghi `audit_logs` (`FR-BE-06`, `FR-BE-07`) và phát sự kiện đồng bộ trạng thái lên `SCR-03`.
  - Mở rộng `POST /api/v1/devices/{device_id}/control` để publish `"1"` / `"0"` lên feed Adafruit IO tương ứng đối với thiết bị vật lý (`is_simulated = 0`).
- [ ] **Kiểm thử hồi quy sau tích hợp:** Chạy `powershell -ExecutionPolicy Bypass -File scripts/check.ps1` đạt `OK` (exit 0), giữ xanh toàn bộ `backend/test_backend.py` và `contracts/test_api_contracts.py`.

### P — Phạm vi UI/UX tới giữa kỳ *(đã xong phần chính, chỉ còn hỗ trợ bàn giao)*
- [x] **Hoàn thiện UI/UX & Prototype chạy thật:** 10 màn hình Responsive Web (`SCR-01` → `SCR-10`), `contracts/api.md`, Backend prototype + Simulator (`backend/main.py`, `backend/simulator.py`), CI/CD & cấu hình deploy (`docs/plans/phase-4-deploy.md`).
- [ ] **Bàn giao hướng dẫn chạy Local & cấu trúc API:** Cung cấp lệnh khởi chạy nhanh `backend/` + `frontend/` và giải thích luồng SSE/REST trong `contracts/api.md` cho thành viên làm cầu nối MQTT.
- [ ] **Bàn giao ảnh chụp màn hình UI/UX:** Chụp bộ ảnh Desktop & Mobile các màn hình `SCR-01` → `SCR-10` để H chèn vào báo cáo giữa kỳ.
- [ ] **Hỗ trợ đồng bộ hiển thị trên `SCR-03` *(nếu nhóm chốt)*:** Cập nhật `frontend/src/components/screens/DeviceControlScreen.tsx` nhận trạng thái realtime (SSE hoặc polling) sau khi Backend chốt cơ chế phát sự kiện, đảm bảo UI tự đổi trạng thái khi thiết bị tắt/mở từ ngoài App.

### H — Báo cáo giữa kỳ (`report/`) & Điều phối nộp bài
- [ ] **Hoàn thiện nội dung Báo cáo giữa kỳ (`report/`):** Bổ sung chương Thiết kế giao diện UI/UX (ảnh màn hình từ P), Thiết kế CSDL (sơ đồ ERD khớp `backend/database.py`), Kiến trúc & kết nối thiết bị (tham chiếu `docs/ARCHITECTURE.md`) theo mốc `docs/sources/timeline.pdf`.
- [ ] **Soạn kịch bản lời thoại & đính kèm link video:** Chuẩn hóa phần trình bày trong video ≤ 5 phút, chèn link video đã upload vào báo cáo giữa kỳ (đã kiểm tra mở được bằng trình duyệt ẩn danh) và biên dịch PDF kiểm tra trình bày.

### Cả nhóm — Tích hợp End-to-End, Quay Video & Nộp LMS
- [ ] **Chạy thử End-to-End toàn luồng:** Kiểm tra ổn định luồng `Thiết bị thật ↔ Gateway ↔ Adafruit IO ↔ Backend ↔ Web/Mobile App` trên cả màn hình Desktop và Mobile (`SCR-02`, `SCR-03`, `SCR-07`).
- [ ] **Quay 1 file video duy nhất (≤ 5 phút):** Quay rõ mạch thật, thao tác tắt/mở thiết bị, màn hình Adafruit IO đổi trạng thái, màn hình ứng dụng Web/Mobile đổi trạng thái và phần trình bày.
- [ ] **Upload & Nộp đúng hạn Tuần 46:** Upload video lên kênh đã chốt, kiểm tra quyền xem công khai, đính kèm link vào báo cáo và nộp lên LMS.

---

## 4. KHUNG KỊCH BẢN VIDEO DEMO GIỮA KỲ (1 FILE DUY NHẤT, ≤ 5 PHÚT)

Khuyến nghị quay màn hình kết hợp camera thiết bị thật trong **cùng 1 khung hình liên tục** (Picture-in-Picture hoặc chia 3 vùng: Camera mạch thật | Adafruit IO Dashboard | Ứng dụng Smart Farm Web/Mobile) để chứng minh trạng thái đổi theo thời gian thực không cắt ghép. Mục tiêu tổng thời lượng **~4 phút 30 giây**:

| Mốc thời gian | Phân đoạn | Nội dung trình bày & thao tác cần thấy rõ trên hình |
| :---: | :--- | :--- |
| `0:00 – 0:40` | **Giới thiệu & Kiến trúc** | Tên đề tài, thành viên nhóm, kiến trúc 4 tầng (`Yolo:Bit ↔ Python Gateway ↔ Adafruit IO ↔ Backend & Web/Mobile App`). |
| `0:40 – 1:30` | **Module 1: Cảm biến → App** | Tác động nhiệt độ/độ ẩm/ẩm đất trên kit → LCD hiển thị → số liệu nhảy trên Adafruit IO → `SCR-02` Dashboard cập nhật realtime. |
| `1:30 – 3:00` | **Luồng trọng tâm: Tắt/Mở Thiết bị** | **Thao tác tắt/mở trực tiếp trên thiết bị thật** → trạng thái thay đổi tức thì trên Adafruit IO Dashboard → trạng thái thiết bị trên Web/Mobile App (`SCR-03`) tự động thay đổi theo; demo thêm chiều bật/tắt từ App (`SCR-03`) → thiết bị thật phản hồi và ghi Audit Log (`SCR-07`). |
| `3:00 – 4:10` | **UI/UX & Trọng tâm HTTT** | Lướt nhanh các màn hình còn lại trên Desktop & Mobile (`SCR-04` ngưỡng/lịch, `SCR-05` cảnh báo, `SCR-06` báo cáo xuất file, `SCR-08`–`SCR-10` phân quyền/quản trị). |
| `4:10 – 4:30` | **Tổng kết & Lộ trình cuối kỳ** | Tóm tắt tiến độ đã đạt và kế hoạch tích hợp Rule Engine / hoàn thiện cuối kỳ. |

---

## 5. TỔNG QUAN TIẾN ĐỘ DỰ ÁN & QUYẾT ĐỊNH ĐÃ CHỐT

### Bảng tiến độ theo giai đoạn

| Hạng mục | Trạng thái | Phụ trách | Ghi chú |
| :--- | :---: | :---: | :--- |
| **Bối cảnh bài toán, UR → UC** | **HOÀN THÀNH** | P, H | 8 UR, 11 FR, 6 NFR, 13 UC (`docs/USE_CASES.md`, `docs/REQUIREMENTS.md`) |
| **Khung Agent-Friendly Repo & `scripts/check.ps1`** | **HOÀN THÀNH** | P | Chuẩn hóa `AGENTS.md`, `contracts/`, `docs/` |
| **Chốt định hướng nghiệp vụ (Q1–Q4)** | **HOÀN THÀNH** | Cả nhóm | Multi-tenant commercial, dynamic device, open-field farm |
| **Đối soát 9 Quality Gates (G1–G9)** | **HOÀN THÀNH** | Cả nhóm | Đạt độ phủ 100% đề bài trong `docs/USE_CASES.md` |
| **Đặc tả Use Case & API Contract (`contracts/api.md`)** | **HOÀN THÀNH** | P | 13 UC, 10 màn hình `SCR-01` → `SCR-10`, 2 vai trò Admin/Operator |
| **Backend Prototype + Simulator (`backend/`)** | **HOÀN THÀNH** | P | Python FastAPI + SQLite + SSE Simulator + pytest gate |
| **Frontend Responsive Web (`frontend/`)** | **HOÀN THÀNH** | P | Hoàn thiện 10 màn hình `SCR-01` → `SCR-10` (React + Vite + ECharts + Tailwind) |
| **CI/CD & Cấu hình Deploy (`docs/plans/phase-4-deploy.md`)** | **HOÀN THÀNH** | P | GitHub Actions CI + Dockerfile + `render.yaml` + NFR-04 security headers |
| **Firmware & IoT Gateway (`firmware/`, `gateway/`)** | *CHỜ TRIỂN KHAI* | N, Q | Kết nối kit Yolo:Bit ↔ UART ↔ Adafruit IO cho Zone PoC |
| **Cầu nối Adafruit IO ↔ Backend (`backend/main.py`)** | *CHỜ PHÂN CÔNG* | N / Q / H | MQTT Worker subscribe/publish feeds cho thiết bị vật lý |
| **Báo cáo giữa kỳ (`report/`) & Video Demo ≤ 5 phút** | *ĐANG TRIỂN KHAI* | H, Cả nhóm | Bổ sung UI/UX + ERD + quay video nộp LMS Tuần 46 |

### Các việc dài hạn sau giữa kỳ
- [ ] **Chốt ADR Tech Stack & CSDL chính thức (`docs/decisions/`):** Đánh giá giữ SQLite/FastAPI hoặc nâng cấp CSDL theo nhu cầu cuối kỳ. (Phụ trách: Cả nhóm)
- [ ] **Nghiệm thu tích hợp tự động toàn hệ thống:** Test parser UART/MQTT, backend và contract chạy tự động qua `scripts/check.ps1` đạt 100%. (Phụ trách: Cả nhóm)

### Các quyết định nghiệp vụ đã chốt
- **Q1 (Tenancy & Cấu trúc phân cấp):** Hệ thống phục vụ đa chủ (Multi-tenant: Admin/Chủ trang trại $\rightarrow$ nhiều Farm $\rightarrow$ nhiều Zone $\rightarrow$ 1 Crop/Zone). Loại hình canh tác: Nông trại ngoài trời (Open-field Farm).
- **Q2 (Hành vi & Tự động hóa):** Cấu hình trực tiếp trên Dashboard theo từng Zone/Thiết bị (ngưỡng an toàn, luật tự động hóa, lịch tưới); khi bấm **Apply** đồng bộ ngay tức thì thời gian thực (Realtime Sync) xuống thiết bị chấp hành.
- **Q3 (Phân cấp Thiết bị & Khả năng mở rộng):** Thiết bị động linh hoạt (Dynamic 1..N Input/Output per Zone). Có cơ chế giả lập (Simulator) mở rộng quy mô thương mại; kit phần cứng lab là PoC kết nối vật lý thực nghiệm cho 1 Zone.
- **Q4 (Nền tảng hiển thị):** **Responsive Web App** (thiết kế chuẩn Web Desktop/Tablet, co giãn tối ưu hiển thị và điều khiển trên Mobile cho toàn bộ màn hình `SCR-01` đến `SCR-10`).
- **Phân quyền RBAC:** Chuẩn hóa đúng 2 vai trò: **Admin** (Quản trị viên / Chủ nông trại) và **Operator** (Người vận hành).

---

## 6. BẢNG VIẾT TẮT THÀNH VIÊN

| Ký hiệu | Vai trò phụ trách chính |
| :---: | :--- |
| P | UI/UX (`frontend/`), API Contract, Backend prototype & khung repo |
| N | Phần cứng (`firmware/`) & IoT Gateway (`gateway/`) |
| Q | Phần cứng (`firmware/`) & IoT Gateway (`gateway/`) |
| H | Báo cáo (`report/`), phân tích nghiệp vụ & điều phối nộp bài |
