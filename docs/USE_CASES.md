# DANH MỤC USE CASE & ÁNH XẠ MÀN HÌNH (USE CASES & SCREENS)

Tài liệu khóa chặt phạm vi 13 Use Case đã hoàn thiện trong báo cáo và ánh xạ trực tiếp sang 10 màn hình giao diện Responsive Web (`SCR-01` $\rightarrow$ `SCR-10`). Agent không tự ý vẽ thêm màn hình ngoài danh mục này.

---

## 1. MA TRẬN ÁNH XẠ USE CASE VÀ MÀN HÌNH

Hệ thống phân quyền chuẩn hóa theo 2 nhóm tác nhân:
* **Admin (Quản trị viên / Chủ nông trại):** Toàn quyền cấu hình cấu trúc nông trại, quản lý thiết bị, cấu hình ngưỡng/lịch, quản lý tài khoản và phân quyền.
* **Operator (Người vận hành):** Giám sát thời gian thực, điều khiển thiết bị thủ công khi cần, tiếp nhận và xác nhận cảnh báo sự cố, tra cứu báo cáo.

| Mã UC | Tên Use Case | Mã Màn | Tên Màn hình | Tác nhân chính | Module liên quan |
| :--- | :--- | :---: | :--- | :---: | :---: |
| UC-01 | Đăng nhập hệ thống | `SCR-01` | Đăng nhập & Xác thực | Admin, Operator | Hệ thống |
| UC-02 | Quản lý tài khoản người dùng | `SCR-08` | Quản lý người dùng & Phân quyền | Admin | Quản trị |
| UC-03 | Phân quyền vai trò (RBAC) | `SCR-08` | Quản lý người dùng & Phân quyền | Admin | Quản trị |
| UC-04 | Quản lý Nông trại & Khu vực canh tác | `SCR-09` | Quản lý Nông trại & Khu vực canh tác | Admin | Quản trị |
| UC-05 | Tra cứu nhật ký hoạt động | `SCR-07` | Nhật ký hoạt động (Audit Log) | Admin | Module 4 (Trọng tâm HTTT) |
| UC-06 | Giám sát thông số cảm biến | `SCR-02` | Giám sát thời gian thực (Dashboard) | Admin, Operator | Module 1, Module 5 |
| UC-07 | Giám sát trạng thái thiết bị | `SCR-03` | Điều khiển thiết bị & Trạng thái | Admin, Operator | Module 3 |
| UC-08 | Điều khiển thiết bị thủ công | `SCR-03` | Điều khiển thiết bị & Trạng thái | Admin, Operator | Module 3 |
| UC-09 | Lập lịch tưới/chiếu sáng | `SCR-04` | Cấu hình Ngưỡng & Lịch trình | Admin | Module 2, Module 3 |
| UC-10 | Thiết lập ngưỡng cảnh báo | `SCR-04` | Cấu hình Ngưỡng & Lịch trình | Admin | Module 2, Module 3 |
| UC-11 | Xử lý và ghi nhận cảnh báo | `SCR-05` | Trung tâm Cảnh báo & Sự cố | Admin, Operator | Module 2 |
| UC-12 | Báo cáo thống kê & Xuất file | `SCR-06` | Báo cáo động & Xuất dữ liệu HTTT | Admin, Operator | Module 5 (Trọng tâm HTTT) |
| UC-13 | Quản lý danh mục thiết bị động | `SCR-10` | Quản lý thiết bị nông trại | Admin | Quản trị |

---

## 2. ĐỐI SOÁT 9 TIÊU CHÍ NGHIỆM THU ĐỀ BÀI (QUALITY GATES G1–G9)

| Gate # | Yêu cầu gốc (`ProjectTitle&FunctionalRequirement.pdf`) | Use Case tương ứng | Màn hình đáp ứng |
| :---: | :--- | :---: | :---: |
| **G1** | Hiển thị dữ liệu tổng hợp toàn hệ thống | **UC-06** | `SCR-02` |
| **G2** | Quản lý theo từng khu đất / mảnh vườn (khác loại cây trồng) | **UC-04** | `SCR-09` |
| **G3** | Quản lý chi tiết từng thiết bị: điều khiển actuator, xem biểu đồ sensor | **UC-06, UC-07, UC-08, UC-13** | `SCR-02, SCR-03, SCR-10` |
| **G4** | Quản lý lịch trình điều khiển thiết bị theo ngày/giờ tự động | **UC-09** | `SCR-04` |
| **G5** | Quản lý thiết lập ngưỡng và hành động tự động đi kèm | **UC-10** | `SCR-04` |
| **G6** | Cảnh báo vượt ngưỡng | **UC-11** | `SCR-05` |
| **G7** | Quản lý nhật ký hành động ứng dụng độc lập (không dùng log IoT server) | **UC-05** | `SCR-07` |
| **G8** | Quản lý user và phân quyền: có tác nhân Admin và Operator riêng biệt | **UC-02, UC-03** | `SCR-08` |
| **G9** | **Trọng tâm HTTT:** Báo cáo trực quan đa chiều, động, tùy chỉnh hiển thị, xuất file | **UC-12** | `SCR-06` |

---

## 3. YÊU CẦU NGƯỜI DÙNG (USER REQUIREMENTS)

| Mã UR | Nội dung yêu cầu người dùng | UC liên quan |
| :--- | :--- | :--- |
| UR-01 | Hệ thống phải liên tục thu thập và cập nhật các chỉ số môi trường (độ ẩm đất, nhiệt độ, độ ẩm không khí, cường độ ánh sáng...) từ các Zone về trung tâm theo chu kỳ đều đặn (không quá 10 giây/lần). | UC-06 |
| UR-02 | Hệ thống phải cho phép người dùng định nghĩa dải ngưỡng môi trường an toàn (Min/Max) cho từng Zone/Cây trồng và tự động kích hoạt thiết bị tương ứng (bơm nước tưới, van điện từ, đèn sưởi) khi thông số vượt ngưỡng. | UC-09, UC-10 |
| UR-03 | Hệ thống phải hỗ trợ người dùng lên lịch trình bật/tắt thiết bị định kỳ theo ngày trong tuần và khoảng thời gian xác định trong ngày nhằm tối ưu hóa chu kỳ tưới tiêu hoặc chiếu sáng. | UC-09 |
| UR-04 | Khi phát hiện điều kiện vi phạm ngưỡng nguy hiểm hoặc sự cố thiết bị, hệ thống phải kích hoạt còi/đèn báo tại chỗ và đồng thời gửi cảnh báo nổi bật trên giao diện người dùng. | UC-10, UC-11 |
| UR-05 | Người dùng có thể theo dõi hiện trạng hoạt động của toàn bộ nông trại qua giao diện Dashboard tập trung, bao gồm trạng thái kết nối của các thiết bị (Online/Offline) và biểu đồ chuỗi thời gian của từng cảm biến. | UC-06, UC-07 |
| UR-06 | Người vận hành có thể gửi lệnh bật/tắt tức thì tới máy bơm, van tưới hoặc dàn đèn từ giao diện ứng dụng với phản hồi nhanh chóng (dưới 2 giây). | UC-08 |
| UR-07 | Hệ thống cung cấp công cụ khai thác số liệu chuyên sâu của HTTT, cho phép lọc động theo Nông trại, Khu vực canh tác (Zone), Loại cây trồng, khoảng thời gian để đánh giá tương quan và tải tệp báo cáo tổng hợp (CSV/Excel/PDF). | UC-12 |
| UR-08 | Hệ thống phải ghi nhận tự động toàn bộ lịch sử can thiệp của người dùng và các sự kiện chuyển trạng thái thiết bị vào cơ sở dữ liệu nội bộ phục vụ tra cứu kiểm toán độc lập. | UC-05 |

---

## 4. DANH SÁCH MÀN HÌNH RESPONSIVE WEB

| Mã màn hình | Tên màn hình | Phục vụ UC | Thiết bị hỗ trợ |
| :--- | :--- | :--- | :--- |
| SCR-01 | Đăng nhập & Xác thực | UC-01 | Desktop, Tablet, Mobile |
| SCR-02 | Giám sát thời gian thực (Dashboard) | UC-06 | Desktop, Tablet, Mobile |
| SCR-03 | Điều khiển thiết bị & Trạng thái | UC-07, UC-08 | Desktop, Tablet, Mobile |
| SCR-04 | Cấu hình Ngưỡng & Lịch trình | UC-09, UC-10 | Desktop, Tablet, Mobile |
| SCR-05 | Trung tâm Cảnh báo & Sự cố | UC-11 | Desktop, Tablet, Mobile |
| SCR-06 | Báo cáo động & Xuất dữ liệu HTTT | UC-12 | Desktop, Tablet, Mobile |
| SCR-07 | Nhật ký hoạt động (Audit Log) | UC-05 | Desktop, Tablet, Mobile |
| SCR-08 | Quản lý người dùng & Phân quyền | UC-02, UC-03 | Desktop, Tablet, Mobile |
| SCR-09 | Quản lý Nông trại & Khu vực canh tác | UC-04 | Desktop, Tablet, Mobile |
| SCR-10 | Quản lý thiết bị nông trại | UC-13 | Desktop, Tablet, Mobile |

---

## 5. QUY CHUẨN THIẾT KẾ CHO TỪNG MÀN HÌNH (RESPONSIVE WEB)

1. **`SCR-01` (Login & Auth):**
   - Form đăng nhập email/mật khẩu, ghi nhớ phiên, thông báo lỗi nếu sai thông tin xác thực.
   - Hỗ trợ phân luồng 2 vai trò đăng nhập (Admin và Operator).
2. **`SCR-02` (Live Dashboard):**
   - Bộ chọn phân cấp: Chọn Nông trại (Farm) $\rightarrow$ Chọn Khu vực canh tác (Zone).
   - Thẻ (Card) hiển thị số đo cảm biến động (Nhiệt độ, Độ ẩm không khí, Độ ẩm đất, Ánh sáng...) kèm màu ngữ nghĩa chỉ báo trạng thái (Xanh lá: An toàn, Vàng: Cảnh báo, Đỏ: Nguy hiểm).
   - Mini-chart xu hướng chuỗi thời gian 24h gần nhất của cảm biến được chọn.
3. **`SCR-03` (Device Control & Status):**
   - Bộ chọn Farm $\rightarrow$ Zone.
   - Danh sách thẻ thiết bị chấp hành động (Máy bơm, Van điện từ, Đèn chiếu sáng...).
   - Switch Toggle Bật/Tắt thủ công tức thì kèm phản hồi trạng thái xác nhận (ACK), hiển thị chế độ hoạt động (Tự động theo ngưỡng/lịch vs Can thiệp thủ công).
4. **`SCR-04` (Threshold & Schedule Config):**
   - Bộ chọn Farm $\rightarrow$ Zone $\rightarrow$ Thiết bị liên kết.
   - Form thiết lập ngưỡng an toàn đa cấp (Min/Max ngưỡng cảnh báo, ngưỡng nguy hiểm) áp dụng cho từng thông số môi trường kèm quy tắc kích hoạt tự động đi kèm (Auto-Action).
   - Bảng lập lịch trình vận hành: Giờ bắt đầu, thời lượng chạy (phút), ngày lặp lại trong tuần.
   - Nút hành động **Apply Configuration**: Đẩy cấu hình mới xuống thiết bị qua cơ chế đồng bộ thời gian thực (Realtime Sync).
5. **`SCR-05` (Alert Center):**
   - Bảng sự cố và cảnh báo theo thời gian thực (phân loại mức độ: Nguy hiểm / Cảnh báo / Nhắc nhở).
   - Nút hành động: "Xác nhận đã xử lý" (Acknowledge) kèm ô nhập ghi chú nguyên nhân và biện pháp khắc phục.
6. **`SCR-06` (HTTT Dynamic Report & Export):**
   - Bộ lọc nghiệp vụ đa chiều: Nông trại, Khu vực (Zone), Loại cây trồng, Khoảng thời gian (Từ ngày - Đến ngày), Loại sự kiện/chỉ số.
   - Tùy chọn tùy biến hiển thị: Bật/tắt các cột dữ liệu và loại biểu đồ trực quan tương quan.
   - Chức năng trích xuất báo cáo: `Export Excel (.xlsx)`, `Export CSV`, `Export PDF Summary`.
7. **`SCR-07` (Audit Log):**
   - Bảng nhật ký kiểm toán bất biến: Mốc thời gian (Timestamp), Tác nhân (User/System), Vai trò (Admin/Operator), Hành động thực hiện, Khu vực (Farm/Zone), Thiết bị tác động, Chi tiết thay đổi (Giá trị cũ $\rightarrow$ Giá trị mới), Địa chỉ IP/Thiết bị.
   - Ô tìm kiếm từ khóa, bộ lọc theo phân loại sự kiện và khoảng thời gian.
8. **`SCR-08` (User Management & RBAC):**
   - Bảng danh sách tài khoản: Họ tên, Email, Vai trò (`Admin` / `Operator`), Nông trại được phân công, Trạng thái kích hoạt.
   - Form thêm mới tài khoản, phân quyền vai trò và khóa/mở khóa tài khoản.
9. **`SCR-09` (Farm & Zone Management):**
   - Danh sách cây phân cấp Nông trại (Farm) và Khu vực canh tác (Zone).
   - Thông tin chi tiết Zone: Mã Zone, Tên khu, Diện tích ($m^2$), Loại cây trồng canh tác (1 Crop per Zone), Vị trí/Tọa độ.
   - Thao tác Thêm/Sửa/Xóa Nông trại và Phân khu canh tác.
10. **`SCR-10` (Device Inventory & Assignment):**
    - Danh mục quản lý thiết bị: Mã thiết bị (Hardware ID/UID), Tên thiết bị, Phân loại (Cảm biến / Chấp hành), Giao thức kết nối, Zone đang được phân bổ, Trạng thái kết nối (Online / Offline).
    - Form đăng ký thiết bị mới, gán/chuyển đổi Zone linh hoạt (Dynamic Allocation 1..N).
