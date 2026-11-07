# DANH MỤC USE CASE & ÁNH XẠ MÀN HÌNH (USE CASES & SCREENS)

Tài liệu khóa chặt phạm vi 13 Use Case đã hoàn thiện trong báo cáo và ánh xạ trực tiếp sang 10 màn hình giao diện (`SCR-01` $\rightarrow$ `SCR-10`). Agent không được tự ý vẽ thêm màn hình ngoài danh mục này.

---

## 1. MA TRẬN ÁNH XẠ USE CASE VÀ MÀN HÌNH

| Mã UC | Tên Use Case | Mã Màn | Tên Màn hình | Tác nhân chính | Module liên quan |
| :--- | :--- | :---: | :--- | :---: | :---: |
| UC-01 | Đăng nhập hệ thống | `SCR-01` | Đăng nhập & Xác thực | Admin, Operator | Hệ thống |
| UC-02 | Quản lý tài khoản người dùng | `SCR-08` | Quản lý người dùng & Phân quyền | Admin | Quản trị |
| UC-03 | Phân quyền vai trò (RBAC) | `SCR-08` | Quản lý người dùng & Phân quyền | Admin | Quản trị |
| UC-04 | Quản lý thông tin khu vực/vườn | `SCR-09` | Quản lý khu vực/vườn | Admin | Quản trị |
| UC-05 | Tra cứu nhật ký hoạt động | `SCR-07` | Nhật ký hoạt động (Audit Log) | Admin | Module 4 (Trọng tâm HTTT) |
| UC-06 | Giám sát thông số cảm biến | `SCR-02` | Giám sát thời gian thực (Dashboard) | Admin, Operator | Module 1, Module 5 |
| UC-07 | Giám sát trạng thái thiết bị | `SCR-03` | Điều khiển thiết bị & Trạng thái | Admin, Operator | Module 3 |
| UC-08 | Điều khiển thiết bị thủ công | `SCR-03` | Điều khiển thiết bị & Trạng thái | Admin, Operator | Module 3 |
| UC-09 | Lập lịch tưới/chiếu sáng | `SCR-04` | Cấu hình Ngưỡng & Lịch trình | Admin | Module 2, Module 3 |
| UC-10 | Thiết lập ngưỡng cảnh báo | `SCR-04` | Cấu hình Ngưỡng & Lịch trình | Admin | Module 2, Module 3 |
| UC-11 | Xử lý và ghi nhận cảnh báo | `SCR-05` | Trung tâm Cảnh báo & Sự cố | Admin, Operator | Module 2 |
| UC-12 | Báo cáo thống kê & Xuất file | `SCR-06` | Báo cáo động & Xuất dữ liệu HTTT | Admin, Operator | Module 5 (Trọng tâm HTTT) |
| UC-13 | Quản lý thiết bị (thêm, sửa, gán thiết bị vào khu vực) | `SCR-10` | Quản lý thiết bị | Admin | Quản trị (Chờ: Q3) |

---

## Yêu cầu người dùng

| Mã UR | Nội dung yêu cầu người dùng | UC liên quan |
| :--- | :--- | :--- |
| UR-01 | Hệ thống phải liên tục thu thập và cập nhật các chỉ số môi trường (độ ẩm đất, nhiệt độ không khí, độ ẩm không khí, cường độ ánh sáng) từ các khu đất về trung tâm theo chu kỳ đều đặn (không quá 10 giây/lần). | UC-06 |
| UR-02 | Hệ thống phải cho phép người dùng định nghĩa dải ngưỡng môi trường an toàn (Min/Max) cho từng loại cây trồng và tự động kích hoạt thiết bị tương ứng (bơm nước tưới gốc, hệ thống phun sương làm mát) khi thông số vượt ngưỡng. | UC-09, UC-10 |
| UR-03 | Hệ thống phải hỗ trợ người dùng lên lịch trình bật/tắt thiết bị định kỳ theo ngày trong tuần và khoảng thời gian xác định trong ngày nhằm tối ưu hóa chu kỳ tưới tiêu hoặc chong đèn quang kỳ. | UC-09 |
| UR-04 | Khi phát hiện điều kiện môi trường vi phạm ngưỡng nguy hiểm hoặc sự cố thiết bị, hệ thống phải kích hoạt còi báo động tại chỗ (Buzzer) và đồng thời gửi cảnh báo nổi bật trên giao diện người dùng. | UC-10, UC-11 |
| UR-05 | Người dùng có thể theo dõi hiện trạng hoạt động của toàn bộ nông trại qua giao diện Dashboard tập trung, bao gồm trạng thái kết nối của các thiết bị (Online/Offline) và biểu đồ chuỗi thời gian của từng cảm biến. | UC-06, UC-07 |
| UR-06 | Người vận hành có thể gửi lệnh bật/tắt tức thì tới máy bơm tưới, hệ thống phun sương hoặc dàn đèn từ giao diện ứng dụng với phản hồi nhanh chóng (dưới 2 giây). | UC-08 |
| UR-07 | Hệ thống cung cấp công cụ khai thác số liệu chuyên sâu của HTTT, cho phép người dùng lọc động theo khu đất, loại cây, khoảng thời gian để đánh giá tương quan môi trường và tải tệp báo cáo tổng hợp (CSV/Excel/PDF). | UC-12 |
| UR-08 | Hệ thống phải ghi nhận tự động toàn bộ lịch sử can thiệp của người dùng và các sự kiện chuyển trạng thái thiết bị vào cơ sở dữ liệu nội bộ phục vụ tra cứu thanh tra. | UC-05 |

---

## Màn hình

| Mã màn hình | Tên màn hình | Phục vụ UC |
| :--- | :--- | :--- |
| SCR-01 | Đăng nhập & Xác thực | UC-01 |
| SCR-02 | Giám sát thời gian thực (Dashboard) | UC-06 |
| SCR-03 | Điều khiển thiết bị & Trạng thái | UC-07, UC-08 |
| SCR-04 | Cấu hình Ngưỡng & Lịch trình | UC-09, UC-10 |
| SCR-05 | Trung tâm Cảnh báo & Sự cố | UC-11 |
| SCR-06 | Báo cáo động & Xuất dữ liệu HTTT | UC-12 |
| SCR-07 | Nhật ký hoạt động (Audit Log) | UC-05 |
| SCR-08 | Quản lý người dùng & Phân quyền | UC-02, UC-03 |
| SCR-09 | Quản lý khu vực/vườn | UC-04 |
| SCR-10 | Quản lý thiết bị | UC-13 (Chờ: Q3) |

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
9. **`SCR-09` (Zone Management):**
   * Danh sách khu đất/mảnh vườn: Tên khu, diện tích, loại cây trồng hiện tại.
   * Form thêm, sửa, xoá khu vực canh tác và cập nhật cây trồng.
10. **`SCR-10` (Device Inventory Management):**
   * Danh mục thiết bị: Mã thiết bị, tên, phân loại (cảm biến / chấp hành), khu vực đang gán, trạng thái hoạt động.
   * Form thêm, sửa thông tin thiết bị và gán thiết bị vào mảnh vườn (Chờ: Q3).
