# TIẾN ĐỘ THỰC HIỆN DỰ ÁN (PROJECT PROGRESS)

Theo dõi tiến độ thực tế theo lộ trình 4 Phase và 12 Use Case của đồ án.

---

## 1. TIẾN ĐỘ THEO LỘ TRÌNH (PHASE TRACKER)

| Phase | Hạng mục | Trạng thái | PIC | Ghi chú |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | **Khởi tạo Agent-Friendly Repo & Contracts** | **ĐANG TRIỂN KHAI** | Phú | Tạo layout, contracts, test_contracts, scripts/check.ps1 |
| **Phase 2** | **Đặc tả & Vẽ Wireframe Mockup (SCR-01 $\rightarrow$ SCR-08)** | *CHƯA BẮT ĐẦU* | Phú | Trọng tâm tuần 42 - 43 |
| **Phase 3** | **IoT Server Adafruit IO & Gateway Python** | *CHƯA BẮT ĐẦU* | Nguyên, Quang | Tạo feeds, viết script pyserial ↔ paho-mqtt |
| **Phase 4** | **Backend API, CSDL PostgreSQL & Audit Log** | *CHƯA BẮT ĐẦU* | Phú | Thiết kế ERD, viết API theo contract |

---

## 2. TIẾN ĐỘ THEO DÕI 12 USE CASE

| Mã UC | Tên Use Case | Phân hệ | Màn hình liên quan | Trạng thái Đặc tả | Trạng thái Mockup | Trạng thái Code |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| `UC-01` | Đăng nhập hệ thống | Quản trị | `SCR-01` | Hoàn thành | Chờ làm | Chưa |
| `UC-02` | Quản lý tài khoản | Quản trị | `SCR-08` | Hoàn thành | Chờ làm | Chưa |
| `UC-03` | Phân quyền vai trò | Quản trị | `SCR-08` | Hoàn thành | Chờ làm | Chưa |
| `UC-04` | Quản lý khu vực/vườn | Quản trị | `SCR-08` | Hoàn thành | Chờ làm | Chưa |
| `UC-05` | Tra cứu Audit Log | Quản trị | `SCR-07` | Hoàn thành | Chờ làm | Chưa |
| `UC-06` | Giám sát cảm biến | Giám sát | `SCR-02` | Hoàn thành | Chờ làm | Chưa |
| `UC-07` | Giám sát trạng thái thiết bị | Giám sát | `SCR-03` | Hoàn thành | Chờ làm | Chưa |
| `UC-08` | Điều khiển thiết bị thủ công | Điều khiển | `SCR-03` | Hoàn thành | Chờ làm | Chưa |
| `UC-09` | Lập lịch tưới/chiếu sáng | Tự động hóa | `SCR-04` | Hoàn thành | Chờ làm | Chưa |
| `UC-10` | Thiết lập ngưỡng cảnh báo | Tự động hóa | `SCR-04` | Hoàn thành | Chờ làm | Chưa |
| `UC-11` | Xử lý & ghi nhận cảnh báo | Cảnh báo | `SCR-05` | Hoàn thành | Chờ làm | Chưa |
| `UC-12` | Báo cáo HTTT & Xuất dữ liệu | Báo cáo HTTT | `SCR-06` | Hoàn thành | Chờ làm | Chưa |

---

## 3. NHẬT KÝ CÔNG VIỆC GẦN NHẤT (RECENT LOGS)

* **2026-11-07:** Thống nhất kế hoạch Agent-Friendly Repository (Contract-First, `scripts/check.ps1`, chuẩn hóa tài liệu).
* **2026-10-24:** Hoàn thành báo cáo giữa kỳ LaTeX (25 trang, 0 lỗi biên dịch, đầy đủ 12 Use Case và 6 đặc tả chi tiết).
