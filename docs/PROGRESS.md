# TIẾN ĐỘ THỰC HIỆN DỰ ÁN (PROJECT PROGRESS)

---

## 1. TIẾN ĐỘ THEO GIAI ĐOẠN

| Hạng mục | Trạng thái | Phụ trách | Ghi chú |
| :--- | :---: | :---: | :--- |
| **Bối cảnh bài toán, UR → UC (Báo cáo giữa kỳ)** | **HOÀN THÀNH** | P, H | 8 UR, 11 FR, 6 NFR, 13 UC trong `report/` |
| **Khung Agent-Friendly Repo & `scripts/check.ps1`** | **HOÀN THÀNH** | P | Chuẩn hóa `AGENTS.md`, `contracts/`, `docs/` |
| **Chốt định hướng nghiệp vụ (Q1–Q4)** | **HOÀN THÀNH** | Cả nhóm | Multi-tenant commercial, dynamic device, open-field farm |
| **Đối soát 9 Quality Gates (G1–G9)** | **HOÀN THÀNH** | Cả nhóm | Đạt độ phủ 100% đề bài trong `docs/USE_CASES.md` |
| **Đặc tả Use Case chi tiết (`docs/USE_CASES.md`)** | **HOÀN THÀNH** | P | Khóa chặt 13 UC, 10 màn Responsive Web, 2 vai trò Admin/Operator |
| **Wireframe Mockup UI (`frontend/mockups/`)** | *SẴN SÀNG TRIỂN KHAI* | P | Responsive Web (`SCR-01` $\rightarrow$ `SCR-10`) |
| **IoT Server Adafruit IO & Gateway Python** | *CHỜ TRIỂN KHAI* | N, Q | Kết nối UART Serial ↔ MQTT Adafruit IO cho Zone PoC |
| **Kiến trúc chi tiết, CSDL & Backend** | **HOÀN THÀNH** | P | Đã chốt stack prototype trong `docs/decisions/0001-tech-stack.md` |

---

## 2. CÁC ĐẦU VIỆC CẦN LÀM TIẾP THEO

### Việc của nhóm
- [x] **Độ phủ yêu cầu môn học:** Đối soát và đảm bảo độ phủ 100% 9 nhóm yêu cầu đề bài (G1–G9 trong `docs/sources/de-bai.pdf`) sang Use Case. (Phụ trách: Cả nhóm)
- [ ] **Chuẩn hóa API Contract:** Thống nhất đặc tả giao tiếp Frontend ↔ Backend trong `contracts/api.md`. (Phụ trách: Cả nhóm)
- [ ] **Tech Stack & CSDL:** Chốt lựa chọn CSDL và framework backend, ghi quyết định vào `docs/decisions/`. (Phụ trách: Cả nhóm)
- [ ] **IoT Gateway:** Viết script Python UART ↔ Adafruit IO trong `gateway/`, test contract pass 100%. (Phụ trách: N, Q)
- [ ] **Nghiệm thu tích hợp:** Test parser và test contract chạy tự động qua `scripts/check.ps1`. (Phụ trách: Cả nhóm)

### Việc của P (Personal Plan — Ưu tiên Live UI/UX & Prototype chạy thật để lấy Feedback)
- [x] **Tài liệu Use Case:** Hoàn thiện đặc tả chi tiết 13 Use Case (`UC-01` → `UC-13`) trong `docs/USE_CASES.md` khớp bối cảnh Farm → Zone → Crop và RBAC 2 roles. (Phụ trách: P)
- [ ] **Bước 1 — Chốt API Contract tối thiểu (`contracts/api.md`):** Định nghĩa các endpoint phục vụ 10 màn hình (`SCR-01` → `SCR-10`) để Frontend và Backend giao tiếp độc lập. (Phụ trách: P)
- [ ] **Bước 2 — Backend FastAPI + SQLite + Realtime Simulator:** Hiện thực Backend bằng **Python FastAPI** + CSDL **SQLite**; tích hợp bộ sinh dữ liệu vi khí hậu realtime (Background Worker / Streaming) giả lập thiết bị. Kiến trúc tạm thời, sẵn sàng chỉnh sửa khi tích hợp phần cứng thật của N và Q. (Phụ trách: P)
- [ ] **Bước 3 — Chốt Tech Stack Frontend & Xây dựng UI/UX Dashboard (`frontend/`):** Thống nhất tech stack (React/Next.js/Vite Tailwind), hiện thực hóa 10 màn hình Responsive Web (`SCR-01` → `SCR-10`) đúng chuẩn UI/UX mong muốn, kết nối Backend để vận hành và lấy feedback. (Phụ trách: P)
- [ ] **Bước 4 — CI/CD & Web Deployment thật:** Thiết lập pipeline CI/CD tự động (chạy `scripts/check.ps1`, test, build và auto-deploy) lên môi trường Web thật để các thành viên khác thoải mái đóng góp code mà không lo vỡ hệ thống. (Phụ trách: P)

---

## 3. CÁC QUYẾT ĐỊNH NGHIỆP VỤ ĐÃ CHỐT

- **Q1 (Tenancy & Cấu trúc phân cấp):** Hệ thống phục vụ đa chủ (Multi-tenant: Admin/Chủ trang trại $\rightarrow$ nhiều Farm $\rightarrow$ nhiều Zone $\rightarrow$ 1 Crop/Zone). Loại hình canh tác: Nông trại ngoài trời (Open-field Farm).
- **Q2 (Hành vi & Tự động hóa):** Cấu hình trực tiếp trên Dashboard theo từng Zone/Thiết bị (ngưỡng an toàn, luật tự động hóa, lịch tưới); khi bấm **Apply** đồng bộ ngay tức thì thời gian thực (Realtime Sync) xuống thiết bị chấp hành.
- **Q3 (Phân cấp Thiết bị & Khả năng mở rộng):** Thiết bị động linh hoạt (Dynamic 1..N Input/Output per Zone). Có cơ chế giả lập (Simulator) mở rộng quy mô thương mại; kit phần cứng lab là PoC kết nối vật lý thực nghiệm cho 1 Zone.
- **Q4 (Nền tảng hiển thị):** **Responsive Web App** (thiết kế chuẩn Web Desktop/Tablet, co giãn tối ưu hiển thị và điều khiển trên Mobile cho toàn bộ màn hình `SCR-01` đến `SCR-10`).
- **Phân quyền RBAC:** Chuẩn hóa đúng 2 vai trò: **Admin** (Quản trị viên / Chủ nông trại) và **Operator** (Người vận hành).

---

## 4. BẢNG VIẾT TẮT THÀNH VIÊN

| Ký hiệu | Tên đầy đủ |
| :---: | :--- |
| P | |
| N | |
| Q | |
| H | |
