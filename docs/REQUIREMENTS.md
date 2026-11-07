# Yêu cầu chức năng

ID không bao giờ đổi hay tái dùng. Yêu cầu bỏ đi thì ghi "(bỏ, YYYY-MM-DD: lý do)", không xoá.
Mã module: FW (firmware), GW (gateway), BE (backend), FE (frontend). ID mới = số lớn nhất của module + 1.

## Firmware

**FR-FW-01 · Đọc cảm biến và hiển thị tại chỗ**
Hệ thống phải hỗ trợ mạch vi điều khiển đọc dữ liệu định kỳ từ cảm biến DHT20, độ ẩm đất, ánh sáng, khoảng cách và hiển thị thông số tóm tắt lên màn hình LCD 16x2 tại hiện trường.
Phục vụ: UC-06

## Gateway

**FR-GW-02 · Chuyển tiếp dữ liệu cảm biến lên mây**
Hệ thống phải đọc gói tin từ cổng Serial của mạch vi điều khiển, loại bỏ dữ liệu ngoại lai hoặc sai định dạng và publish lên các feed tương ứng trên Adafruit IO qua MQTT.
Phục vụ: UC-06

**FR-GW-03 · Tiếp nhận lệnh điều khiển thiết bị**
Hệ thống phải nhận lệnh điều khiển từ các feed MQTT trên Adafruit IO và chuyển tiếp qua Serial xuống mạch vi điều khiển để đóng/ngắt Relay máy bơm, van, quạt và đèn LED RGB.
Phục vụ: UC-08

**FR-GW-04 · Phản hồi trạng thái và ngắt an toàn tại biên**
Hệ thống phải gửi bản tin xác nhận trạng thái mới sau khi thực thi lệnh và tự động ngắt thiết bị chấp hành sau thời gian tối đa nếu mất kết nối mạng để chống tràn nước hoặc quá nhiệt.
Phục vụ: UC-07

## Backend

**FR-BE-01 · Cấu hình ngưỡng cảnh báo đa cấp**
Hệ thống phải cho phép thiết lập và lưu trữ cấu hình ngưỡng an toàn tối thiểu, tối đa và mức nguy hiểm cho từng thông số cảm biến theo từng Khu vực canh tác (Zone), hỗ trợ đồng bộ thời gian thực khi áp dụng.
Phục vụ: UC-10

**FR-BE-02 · So khớp ngưỡng tự động thời gian thực**
Hệ thống phải tự động đối chiếu số đo cảm biến mới nhận với bộ ngưỡng an toàn đang kích hoạt để đánh dấu vi phạm và sinh cảnh báo thời gian thực.
Phục vụ: UC-11

**FR-BE-03 · Phát hiện bất thường khi vận hành thiết bị**
Hệ thống phải phát hiện sự cố chấp hành khi thiết bị đang chạy nhưng chỉ số cảm biến tương ứng không thay đổi hoặc nguồn cấp gặp sự cố trên tập thiết bị động của từng khu vực.
Phục vụ: UC-11

**FR-BE-04 · Quản lý lịch trình vận hành định kỳ**
Hệ thống phải lưu trữ và thực thi các lịch trình bật/tắt thiết bị tự động theo khung giờ trong ngày và các ngày trong tuần kèm thời lượng chạy cho từng Zone, đồng bộ tức thời khi bấm Apply.
Phục vụ: UC-09

**FR-BE-05 · Tự động điều hòa môi trường theo ngưỡng**
Hệ thống phải tự động ra quyết định kích hoạt hoặc ngắt thiết bị chấp hành dựa trên số đo cảm biến vi khí hậu có áp dụng khoảng trễ chống dao động theo cấu hình kích hoạt của từng Zone.
Phục vụ: UC-09, UC-10

**FR-BE-06 · Lưu trữ nhật ký hoạt động độc lập**
Hệ thống phải lưu trữ toàn bộ sự kiện vận hành và can thiệp vào bảng dữ liệu nhật ký độc lập trong cơ sở dữ liệu nội bộ.
Phục vụ: UC-05

**FR-BE-07 · Ghi nhận đầy đủ ngữ cảnh sự kiện kiểm toán**
Hệ thống phải ghi nhận chi tiết mỗi bản ghi nhật ký gồm mã sự kiện, thời gian, Nông trại (Farm), Khu vực (Zone), thiết bị, loại sự kiện, tác nhân kích hoạt và giá trị thay đổi.
Phục vụ: UC-05

**FR-BE-08 · Trích xuất dữ liệu báo cáo ra tệp tin**
Hệ thống phải hỗ trợ xuất dữ liệu thống kê chuỗi thời gian và lịch sử hoạt động đang lọc ra tệp tin định dạng CSV và Excel (.xlsx).
Phục vụ: UC-12

**FR-BE-09 · Quản lý tài khoản và phân quyền người dùng**
Hệ thống phải hỗ trợ xác thực người dùng, quản lý hồ sơ cá nhân và kiểm soát quyền truy cập theo 2 vai trò chuẩn hóa: Quản trị viên / Chủ nông trại (Admin) và Người vận hành (Operator).
Phục vụ: UC-01, UC-02, UC-03

**FR-BE-10 · Quản lý Nông trại, Khu vực canh tác và phân bổ cây trồng**
Hệ thống phải hỗ trợ tạo, cập nhật, xóa thông tin Nông trại (Farm), các Khu vực canh tác trực thuộc (Zone) và gán chuyên canh 1 loại cây trồng tương ứng cho mỗi Zone.
Phục vụ: UC-04

**FR-BE-11 · Quản lý danh mục thiết bị nông trại**
Hệ thống phải quản lý danh sách thiết bị động (1..N thiết bị/Zone) bao gồm định danh phần cứng, khu vực trực thuộc và phân loại cảm biến (Input) hoặc cơ cấu chấp hành (Output).
Phục vụ: UC-13

## Frontend

**FR-FE-01 · Giám sát thông số cảm biến thời gian thực**
Hệ thống phải hiển thị trên giao diện Responsive Web các chỉ số vi khí hậu đo đạc tức thời của từng cảm biến theo Farm và Zone kèm mốc thời gian cập nhật gần nhất.
Phục vụ: UC-06

**FR-FE-02 · Hiển thị trạng thái phân khu và thiết bị**
Hệ thống phải hiển thị trạng thái hoạt động hiện tại (Online/Offline, Bật/Tắt) của danh sách thiết bị động (máy bơm, van điện từ, đèn...) theo từng Farm và Zone trên Responsive Web.
Phục vụ: UC-07

**FR-FE-03 · Chỉ báo trạng thái theo màu sắc ngữ nghĩa**
Hệ thống phải đổi màu trực quan các thẻ đo đạc (xanh lá: bình thường, vàng: cảnh báo sớm, đỏ: vượt ngưỡng nguy hiểm) dựa trên ngưỡng an toàn.
Phục vụ: UC-06

**FR-FE-04 · Giao diện can thiệp điều khiển thủ công**
Hệ thống phải cung cấp các nút công tắc bật/tắt tức thì và thanh trượt điều chỉnh cho người vận hành trên giao diện Responsive Web (hỗ trợ Desktop và Mobile).
Phục vụ: UC-08

**FR-FE-05 · Giao diện tra cứu và lọc nhật ký hoạt động**
Hệ thống phải cung cấp màn hình Responsive Web hỗ trợ tìm kiếm, lọc lịch sử nhật ký theo khoảng thời gian, loại sự kiện, Farm/Zone, nhân viên thực hiện hoặc thiết bị.
Phục vụ: UC-05

**FR-FE-06 · Trực quan hóa dữ liệu phân tích đa chiều**
Hệ thống phải hiển thị các biểu đồ đường chuỗi thời gian đa trục, biểu đồ thời lượng vận hành và thẻ chỉ số chất lượng môi trường trên giao diện Responsive Web.
Phục vụ: UC-12

**FR-FE-07 · Tùy biến bộ lọc báo cáo động**
Hệ thống phải cho phép người dùng tùy chọn linh hoạt khoảng ngày giờ, Farm, Zone, loại cây trồng để tự động tính toán lại các chỉ số thống kê trên Responsive Web.
Phục vụ: UC-12

---

## Phi chức năng

**NFR-01 · Độ trễ phản hồi**
Hệ thống phải đảm bảo thời gian đáp ứng lệnh điều khiển thủ công không quá 2.0 giây và chu kỳ cập nhật dữ liệu cảm biến mới lên giao diện không quá 3.0 giây trong điều kiện mạng ổn định.

**NFR-02 · Tính toàn vẹn dữ liệu**
Hệ thống phải lưu trữ dữ liệu nhật ký hoạt động và số đo cảm biến theo cơ chế chỉ ghi (Append-only) với tỷ lệ thất thoát 0%, chặn tuyệt đối các thao tác sửa hoặc xóa bản ghi qua API.

**NFR-03 · Khả năng chịu lỗi và phục hồi**
Hệ thống phải duy trì bộ đệm cục bộ tại Gateway lưu trữ tối thiểu 1.000 bản ghi cảm biến khi mất kết nối mạng và tự động đồng bộ bù khi kết nối khôi phục với tỷ lệ mất mát nhỏ hơn 0.1%.

**NFR-04 · Bảo mật và kiểm soát truy cập**
Hệ thống phải lưu trữ mật khẩu người dùng dưới dạng mã băm một chiều an toàn, phiên làm việc có thời hạn tối đa 24 giờ và thực thi phân quyền vai trò nghiêm ngặt giữa Quản trị viên (Admin) và Người vận hành (Operator).

**NFR-05 · Hiệu năng truy vấn và báo cáo**
Hệ thống phải xử lý tổng hợp dữ liệu chuỗi thời gian dưới 2.0 giây cho 10.000 bản ghi và hoàn tất xuất file báo cáo tổng hợp dưới 3.0 giây.

**NFR-06 · Tính khả dụng và tương thích giao diện**
Hệ thống phải hỗ trợ giao diện Responsive Web tương thích từ độ phân giải 360px trở lên (Mobile) đến 1920px (Desktop), độ tương phản màu sắc đạt chuẩn tối thiểu 4.5:1 và vùng chạm cảm ứng nút bấm chính tối thiểu 48x48dp.

---

<!--
## Đối chiếu mã cũ

| Cũ | Mới | Ghi chú |
| :--- | :--- | :--- |
| `FR-IOT-01` | `FR-FW-01` | Mạch vi điều khiển đọc cảm biến và hiển thị LCD |
| `FR-IOT-02` | `FR-GW-02` | Gateway đọc Serial và publish MQTT |
| `FR-IOT-03` | `FR-GW-03` | Gateway nhận lệnh MQTT gửi xuống mạch qua Serial |
| `FR-IOT-04` | `FR-GW-04` | Phản hồi ACK và tự ngắt an toàn tại biên |
| `FR-MOD1-01` | `FR-FE-01` | Dashboard hiển thị chỉ số cảm biến tức thời |
| `FR-MOD1-02` | `FR-FE-02` | Hiển thị phân khu và trạng thái thiết bị |
| `FR-MOD1-03` | `FR-FE-03` | Chỉ báo trạng thái theo màu sắc ngữ nghĩa |
| `FR-MOD2-01` | `FR-BE-01` | Cấu hình ngưỡng cảnh báo đa cấp |
| `FR-MOD2-02` | `FR-BE-02` | So khớp ngưỡng tự động thời gian thực |
| `FR-MOD2-03` | `FR-BE-03` | Phát hiện bất thường khi vận hành thiết bị |
| `FR-MOD3-01` | `FR-FE-04` | Giao diện điều khiển thiết bị thủ công |
| `FR-MOD3-02` | `FR-BE-04` | Quản lý lịch trình tự động |
| `FR-MOD3-03` | `FR-BE-05` | Tự động hóa điều hòa môi trường theo ngưỡng |
| `FR-MOD4-01` | `FR-BE-06` | Lưu trữ nhật ký hoạt động độc lập |
| `FR-MOD4-02` | `FR-BE-07` | Ghi nhận đầy đủ ngữ cảnh sự kiện kiểm toán |
| `FR-MOD4-03` | `FR-FE-05` | Giao diện tra cứu và lọc nhật ký hoạt động |
| `FR-IS-01` | `FR-FE-06` | Trực quan hóa dữ liệu phân tích đa chiều |
| `FR-IS-02` | `FR-FE-07` | Tùy biến bộ lọc báo cáo động |
| `FR-IS-03` | `FR-BE-08` | Trích xuất dữ liệu báo cáo ra tệp tin CSV/Excel |
| `FR-IS-04` | `FR-BE-09` | Quản lý tài khoản và phân quyền người dùng |
| `FR-01` | `FR-BE-09` | Báo cáo cũ: Quản lý truy cập & Tài khoản |
| `FR-02` | `FR-BE-10` | Báo cáo cũ: Quản lý cấu trúc nông trại |
| `FR-03` | `FR-BE-11` | Báo cáo cũ: Quản lý danh mục thiết bị |
| `FR-04` | `FR-BE-06`, `FR-BE-07`, `FR-FE-05` | Báo cáo cũ: Nhật ký ứng dụng (Audit Log) |
| `FR-05` | `FR-FE-01`, `FR-FE-02` | Báo cáo cũ: Giám sát tổng quan (Dashboard) |
| `FR-06` | `FR-FE-06` | Báo cáo cũ: Giám sát chi tiết & Biểu đồ |
| `FR-07` | `FR-FE-04`, `FR-GW-03` | Báo cáo cũ: Điều khiển thiết bị thủ công |
| `FR-08` | `FR-BE-04` | Báo cáo cũ: Quản lý lịch trình tự động |
| `FR-09` | `FR-BE-01`, `FR-BE-05` | Báo cáo cũ: Thiết lập ngưỡng & Hành động |
| `FR-10` | `FR-BE-02`, `FR-BE-03` | Báo cáo cũ: Tiếp nhận & Xử lý cảnh báo |
| `FR-11` | `FR-FE-07`, `FR-BE-08` | Báo cáo cũ: Báo cáo động & Xuất dữ liệu |
-->
