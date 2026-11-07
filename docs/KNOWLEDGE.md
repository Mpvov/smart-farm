# TRI THỨC NỀN TẢNG DỰ ÁN (PROJECT KNOWLEDGE)

**Đồ án môn học Đa ngành (CO3111) - Hướng Hệ Thống Thông Tin (HTTT)**

---

## 1. THÔNG TIN CỐT LÕI & PHẠM VI ĐÃ CHỐT

* **Tên đề tài:** Smart Farm Device Management System (Ứng dụng quản lý thiết bị cho nông trại thông minh).
* **Nhóm 4:** H (Use Case), P (UR, UI, Backend), N & Q (IoT Server & Gateway).
* **Bước hiện tại:** Đã xong **UR → UC** (8 UR, 11 FR, 6 NFR, 12 UC) và bối cảnh bài toán nông trại đa khu đất/mảnh vườn (Zone / Plot).
* **Các quyết định CHƯA CHỐT (cần hỏi trước khi làm):**
  * Sản phẩm phục vụ **1 chủ nông trại** (nhiều khu vườn) hay **nhiều chủ nông trại** (multi-tenant)?
  * Tech stack Frontend (Web hay Mobile), Backend framework, Hệ quản trị CSDL.
  * Chi tiết thiết bị Input/Output thực tế.

---

## 2. TRỌNG TÂM CHUYÊN NGÀNH HỆ THỐNG THÔNG TIN (HTTT)

Barem chấm điểm chuyên ngành HTTT yêu cầu:
1. **5 Modules bắt buộc của đề cương:**
   * Module 1: Nhận dữ liệu cảm biến đầu vào.
   * Module 2: Kiểm tra ngưỡng & phát hiện bất thường.
   * Module 3: Điều khiển thiết bị đầu ra (tự động & thủ công).
   * Module 4: Ghi nhận nhật ký hành động (Audit/Activity Log độc lập trong CSDL).
   * Module 5: Data Dashboard trực quan hóa trạng thái và lịch sử.
2. **Đặc trưng hướng HTTT:**
   * Báo cáo trực quan đa chiều (theo thời gian, khu vực, trạng thái thiết bị, sự kiện cảnh báo).
   * Báo cáo động với bộ lọc linh hoạt và xuất file (Excel/CSV/PDF).
   * Thiết kế CSDL chuẩn hóa (ERD) và phân quyền (Admin vs Operator).

---

## Nguồn

Các tài liệu gốc bên ngoài được lưu tại `docs/sources/`:

* `docs/sources/de-bai.pdf`: Đề bài chính thức và yêu cầu chức năng tổng quan của đề tài Smart Farm từ giảng viên.
* `docs/sources/de-cuong.pdf`: Đề cương môn học Đồ án đa ngành (CO3111), chuẩn đầu ra và tiêu chí đánh giá.
* `docs/sources/timeline.pdf`: Lịch trình chi tiết và các mốc báo cáo/đánh giá đồ án trong học kỳ.
* `docs/sources/danh-sach-thiet-bi.jpg`: Ảnh chụp bộ kit phần cứng YoloFarm kèm danh mục linh kiện được cấp.
* `docs/sources/guides/yolofarm-aiot.pdf`: Tài liệu hướng dẫn sử dụng và kết nối bộ kit phần cứng YoloFarm AIoT.
* `docs/sources/guides/giao-trinh-iot-python.pdf`: Giáo trình thực hành lập trình IoT sử dụng ngôn ngữ Python.
* `docs/sources/past-reports/bao-cao-cuoi-ky-1.pdf`: Báo cáo Đồ án đa ngành cuối kỳ mẫu của nhóm khóa trước.
* `docs/sources/past-reports/report-2-2.pdf`: Báo cáo mẫu giai đoạn đánh giá 2 của đồ án khóa trước.
* `docs/sources/past-reports/sample-report.pdf`: Mẫu báo cáo đồ án tham khảo về hình thức và cấu trúc.
* `docs/sources/past-reports/dadn.pdf`: Báo cáo mẫu tổng hợp đề tài Đồ án đa ngành.

---

## Thiết bị

Chép từ `docs/sources/danh-sach-thiet-bi.jpg`:

| STT | Tên thiết bị / linh kiện | Phân loại | Ghi chú |
| :---: | :--- | :--- | :--- |
| 1 | Remote điều khiển từ xa | Điều khiển | Kèm pin nút |
| 2 | Yolo:Bit | Bo mạch chính | Vi điều khiển trung tâm |
| 3 | Dây tín hiệu x6 | Phụ kiện kết nối | 6 sợi cáp kết nối module |
| 4 | Động cơ Servo | Thiết bị chấp hành | Kèm bộ cánh tay servo và ốc vít |
| 5 | Mạch mở rộng | Bo mạch mở rộng | Mở rộng chân cắm cho Yolo:Bit |
| 6 | Dây cáp USB - C | Phụ kiện kết nối | Nạp code / cấp nguồn |
| 7 | Ống dẫn nước | Phụ kiện tưới | Dùng cho bơm nước |
| 8 | Cảm biến nhiệt độ độ ẩm DHT20 | Cảm biến (Input) | Giao tiếp I2C |
| 9 | Cảm biến hồng ngoại | Cảm biến (Input) | PIR sensor |
| 10 | Công tắc Relay | Thiết bị đóng ngắt | Điều khiển tải AC/DC |
| 11 | Công tắc USB | Thiết bị đóng ngắt | Đóng ngắt nguồn qua cổng USB |
| 12 | Đèn 4 LED RGB | Thiết bị hiển thị / chấp hành | Đèn chiếu sáng / báo hiệu đa màu |
| 13 | Quạt mini | Thiết bị chấp hành | Làm mát / thông gió |
| 14 | Cảm biến độ ẩm đất | Cảm biến (Input) | Dạng 2 que cắm đất |
| 15 | Mắt đọc tín hiệu hồng ngoại | Cảm biến (Input) | Nhận tín hiệu IR từ remote |
| 16 | Cảm biến ánh sáng | Cảm biến (Input) | Quang trở quang học |
| 17 | Màn hình LCD 16x2 | Thiết bị hiển thị | Hiển thị 2 dòng x 16 ký tự |
| 18 | Cảm biến khoảng cách | Cảm biến (Input) | Cảm biến siêu âm Ultrasonic |
| 19 | Động cơ bơm nước | Thiết bị chấp hành | Bơm chìm mini |
