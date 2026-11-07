# TIẾN ĐỘ THỰC HIỆN DỰ ÁN (PROJECT PROGRESS)

---

## 1. TIẾN ĐỘ THEO GIAI ĐOẠN

| Hạng mục | Trạng thái | Phụ trách | Ghi chú |
| :--- | :---: | :---: | :--- |
| **Bối cảnh bài toán, UR → UC (Báo cáo giữa kỳ)** | **HOÀN THÀNH** | P, H | 8 UR, 11 FR, 6 NFR, 12 UC trong `report/` |
| **Khung Agent-Friendly Repo & `scripts/check.ps1`** | **HOÀN THÀNH** | P | Chuẩn hóa `AGENTS.md`, `contracts/`, `docs/` |
| **Chốt bài toán mở rộng & Wireframe (`frontend/mockups/`)** | *ĐANG CHUẨN BỊ* | P | Cần chốt phạm vi 1 hay nhiều chủ nông trại trước khi vẽ |
| **IoT Server Adafruit IO & Gateway Python** | *CHỜ TRIỂN KHAI* | N, Q | Kết nối UART Serial ↔ MQTT Adafruit IO |
| **Kiến trúc chi tiết, CSDL & Backend** | *CHƯA CHỐT STACK* | P | Chờ quyết định trong `docs/decisions/` |

---

## 2. CÁC ĐẦU VIỆC CẦN LÀM TIẾP THEO

### Việc của nhóm
- [ ] **Độ phủ yêu cầu môn học:** Đối soát và đảm bảo độ phủ 100% 9 nhóm yêu cầu đề bài (G1–G9 trong `docs/sources/de-bai.pdf`) sang Use Case. (Phụ trách: Cả nhóm)
- [ ] **Chuẩn hóa API Contract:** Thống nhất đặc tả giao tiếp Frontend ↔ Backend trong `contracts/api.md`. (Phụ trách: Cả nhóm)
- [ ] **Tech Stack & CSDL:** Chốt lựa chọn CSDL và framework backend, ghi quyết định vào `docs/decisions/`. (Phụ trách: Cả nhóm)
- [ ] **IoT Gateway:** Viết script Python UART ↔ Adafruit IO trong `gateway/`, test contract pass 100%. (Phụ trách: N, Q)
- [ ] **Nghiệm thu tích hợp:** Test parser và test contract chạy tự động qua `scripts/check.ps1`. (Phụ trách: Cả nhóm)

### Việc của P
- [ ] **Tài liệu Use Case:** Hoàn thiện đặc tả chi tiết 12 Use Case trong `docs/USE_CASES.md` và `report/section/UseCase.tex`. (Phụ trách: P)
- [ ] **Wireframe Mockup UI:** Dựng wireframe mockup cho từng màn hình `SCR-01` đến `SCR-08` trong `frontend/mockups/` (dữ liệu theo `contracts/samples/`). (Phụ trách: P)
- [ ] **Phát triển Backend:** Thiết kế ERD, API schema theo `contracts/api.md`, hiện thực bảng Audit Log và phân quyền RBAC. (Phụ trách: P)

---

## 3. CÂU HỎI CẦN CHỐT

- **Q1:** Quy mô chủ thể (Tenancy): Phục vụ 1 nông trại duy nhất (nhiều khu đất/mảnh vườn) hay nhiều chủ nông trại (multi-tenant)? — chưa chốt
- **Q2:** Quan hệ Khu đất – Cây trồng – Lịch/Ngưỡng: Lịch trình và ngưỡng an toàn gắn theo Loại cây trồng hay gắn trực tiếp trên từng Mảnh vườn? — chưa chốt
- **Q3:** Phân cấp Thiết bị: Người dùng tự thêm/gán động thiết bị (cảm biến, bơm, đèn) vào từng mảnh vườn trên UI hay danh sách thiết bị cố định? — chưa chốt
- **Q4:** Nền tảng hiển thị (Target Viewport): Thiết kế giao diện cho Web App hay Mobile App? — chưa chốt

---

## 4. BẢNG VIẾT TẮT THÀNH VIÊN

| Ký hiệu | Tên đầy đủ |
| :---: | :--- |
| P | |
| N | |
| Q | |
