# TRI THỨC NỀN TẢNG DỰ ÁN (PROJECT KNOWLEDGE)

**Đồ án môn học Đa ngành (CO3111) - Hướng Hệ Thống Thông Tin (HTTT)**  
**Trường Đại học Bách Khoa - ĐHQG TP.HCM**

---

## 1. THÔNG TIN CỐT LÕI

* **Tên đề tài:** Smart Farm Device Management System (Ứng dụng quản lý thiết bị cho nông trại thông minh).
* **Giảng viên hướng dẫn:** TS. Trần Thị Quế Nguyệt.
* **Nhóm 4:**
  * Lý Trung Hòa (2311097) - Phụ trách System Requirement & Use Case.
  * Nguyễn Miên Phú (2312658) - Nhóm trưởng, Phụ trách Kiến trúc, UI Mockup & Backend.
  * Trương Thái Nguyên (2312391) - Phụ trách IoT Server (Adafruit IO) & Gateway Python.
  * Ngô Phương Quang (2352967) - Phụ trách IoT Gateway Python & Thử nghiệm thiết bị.
* **Bối cảnh nghiệp vụ:** Nông trại phân cấp gồm nhiều khu đất / mảnh vườn (Zone / Plot). Mỗi khu trồng loại cây khác nhau, có nhu cầu môi trường, lịch trình tưới tiêu và ngưỡng cảnh báo riêng biệt.

---

## 2. TRỌNG TÂM CHUYÊN NGÀNH HỆ THỐNG THÔNG TIN (HTTT)

Barem chấm điểm chuyên ngành HTTT yêu cầu tập trung sâu vào các tính năng dữ liệu nghiệp vụ:
1. **Báo cáo trực quan đa chiều (Multi-dimensional Reporting):** Theo thời gian, theo khu vực/mảnh vườn, theo trạng thái thiết bị, theo sự kiện cảnh báo.
2. **Báo cáo động (Dynamic Reporting):** Tùy biến bộ lọc linh hoạt (ngày, khu vực, trạng thái).
3. **Hỗ trợ xuất dữ liệu (Data Export):** Tải file Excel (`.xlsx`), CSV và PDF tổng hợp.
4. **Cơ sở dữ liệu quan hệ chuẩn hóa (ERD):** Thiết kế đúng chuẩn 3NF, toàn vẹn dữ liệu.
5. **Nhật ký hoạt động (Audit/Activity Log):** Lưu trữ trong bảng riêng biệt của CSDL, ghi nhận mọi hành động thay đổi cấu hình, điều khiển thiết bị của người dùng.

---

## 3. DANH MỤC PHẦN CỨNG & CẢM BIẾN

* **Mạch điều khiển:** Yolo:bit / Micro:bit (lập trình gửi gói tin UART Serial qua cổng USB).
* **Thiết bị Input (Cảm biến):**
  1. Cảm biến nhiệt độ & độ ẩm không khí: `DHT20` / `DHT11`.
  2. Cảm biến độ ẩm đất: `Capacitive Soil Moisture Sensor`.
* **Thiết bị Output (Cơ cấu chấp hành):**
  1. Relay điều khiển máy bơm nước mini 5V/12V.
  2. Đèn cảnh báo / Module LED RGB / Quạt thông gió mini.
* **IoT Gateway:** Laptop/Máy tính chạy Python script (`pyserial` đọc cổng COM và `paho-mqtt` giao tiếp Adafruit IO Broker).
