# DANH MỤC USE CASE & ÁNH XẠ MÀN HÌNH (USE CASES & SCREENS)

Tài liệu khóa chặt phạm vi 12 Use Case đã hoàn thiện trong báo cáo và ánh xạ trực tiếp sang 8 màn hình giao diện (`SCR-01` $\rightarrow$ `SCR-08`). Agent không được tự ý vẽ thêm màn hình ngoài danh mục này.

---

## 1. MA TRẬN ÁNH XẠ USE CASE VÀ MÀN HÌNH

| Mã Màn | Tên Màn hình | Use Case ánh xạ | Tác nhân chính | Module liên quan |
| :---: | :--- | :--- | :---: | :---: |
| **`SCR-01`** | Đăng nhập & Xác thực | `UC-01`: Đăng nhập hệ thống | Admin, Operator | Hệ thống |
| **`SCR-02`** | Giám sát thời gian thực (Dashboard) | `UC-06`: Giám sát thông số cảm biến | Admin, Operator | Module 1, Module 5 |
| **`SCR-03`** | Điều khiển thiết bị & Trạng thái | `UC-07`: Giám sát trạng thái thiết bị<br>`UC-08`: Điều khiển thiết bị thủ công | Admin, Operator | Module 3 |
| **`SCR-04`** | Cấu hình Ngưỡng & Lịch trình | `UC-09`: Lập lịch tưới/chiếu sáng<br>`UC-10`: Thiết lập ngưỡng cảnh báo | Admin | Module 2, Module 3 |
| **`SCR-05`** | Trung tâm Cảnh báo & Sự cố | `UC-11`: Xử lý và ghi nhận cảnh báo | Admin, Operator | Module 2 |
| **`SCR-06`** | Báo cáo động & Xuất dữ liệu HTTT | `UC-12`: Báo cáo thống kê & Xuất file | Admin, Operator | Module 5 (Trọng tâm HTTT) |
| **`SCR-07`** | Nhật ký hoạt động (Audit Log) | `UC-05`: Tra cứu nhật ký hoạt động | Admin | Module 4 (Trọng tâm HTTT) |
| **`SCR-08`** | Quản lý người dùng & Phân quyền | `UC-02`: Quản lý tài khoản người dùng<br>`UC-03`: Phân quyền vai trò (RBAC)<br>`UC-04`: Quản lý thông tin khu vực/vườn | Admin | Quản trị |

---

## 2. QUY CHUẨN THIẾT KẾ CHO TỪNG MÀN HÌNH (PHASE 2 MOCKUP)

1. **`SCR-01` (Login):** Form đăng nhập email/mật khẩu, ghi nhớ phiên, thông báo lỗi nếu sai credentials.
2. **`SCR-02` (Live Dashboard):**
   * Bộ lọc theo Khu vực canh tác (Zone 1, Zone 2...).
   * Card số đo cảm biến (Nhiệt độ, Độ ẩm không khí, Độ ẩm đất) kèm màu chỉ báo (Xanh: bình thường, Đỏ: vượt ngưỡng).
   * Mini-chart xu hướng 24h gần nhất.
3. **`SCR-03` (Device Control):**
   * Danh sách thiết bị: Bơm nước, Quạt gió, Đèn quang kỳ.
   * Switch Toggle Bật/Tắt thủ công, hiển thị chế độ hoạt động (Tự động theo lịch vs Thủ công).
4. **`SCR-04` (Threshold & Schedule):**
   * Form đặt ngưỡng: Min - Max độ ẩm đất, nhiệt độ trần.
   * Bảng lịch hẹn: Giờ tưới, thời lượng (phút), ngày lặp lại.
5. **`SCR-05` (Alert Center):**
   * Bảng danh sách cảnh báo theo thời gian thực (Mức độ: High / Medium / Low).
   * Nút hành động: "Xác nhận đã xử lý" (Acknowledge), ghi chú nguyên nhân.
6. **`SCR-06` (HTTT Dynamic Report & Export):**
   * Bộ lọc đa chiều: Từ ngày - Đến ngày, Mảnh vườn, Loại thiết bị, Sự kiện bất thường.
   * Biểu đồ trực quan và Bảng tổng hợp số liệu.
   * Nút xuất file: `Export Excel (.xlsx)`, `Export CSV`, `Export PDF Summary`.
7. **`SCR-07` (Audit Log):**
   * Bảng ghi nhận bất biến: Timestamp, Tên người dùng, Vai trò, Hành động thực hiện, Chi tiết thay đổi, IP/Thiết bị.
   * Ô tìm kiếm theo từ khóa và lọc theo khoảng thời gian.
8. **`SCR-08` (User Management):**
   * Bảng danh sách tài khoản: Họ tên, Email, Role (Admin / Operator), Trạng thái kích hoạt.
   * Nút Thêm mới / Đổi role / Khóa tài khoản.
