# UART Serial Contract

Quy chuẩn giao tiếp UART Serial giữa Mạch vi điều khiển (Yolo:bit / Micro:bit) và IoT Gateway (Python script).

---

## 1. Cấu hình phần cứng (Hardware Spec)
* **Baudrate:** `115200`
* **Data bits:** `8`
* **Stop bits:** `1`
* **Parity:** `None`

---

## 2. Định dạng gói tin (Packet Format)

Mọi gói tin UART bắt đầu bằng ký tự `!` và kết thúc bằng ký tự `#`.

```text
!<ZONE_ID>:<KEY>:<VALUE>#
```

* `<ZONE_ID>`: Số nguyên định danh khu vực / mảnh vườn canh tác (Zone 1, Zone 2...). Hiện tại cố định là `1`.
* `<KEY>`: Tên định danh cảm biến hoặc cơ cấu chấp hành (In hoa):
  * `TEMP`: Nhiệt độ không khí (°C)
  * `HUMI`: Độ ẩm không khí (%)
  * `SOIL`: Độ ẩm đất (%)
  * `PUMP`: Relay máy bơm nước
  * `LED`: Đèn cảnh báo / chiếu sáng
* `<VALUE>`: Giá trị tương ứng:
  * Số thực hoặc số nguyên cho cảm biến (ví dụ: `28`, `65.5`, `42`).
  * Trạng thái cho cơ cấu chấp hành: `ON` hoặc `OFF`.

---

## 3. Các gói tin chuẩn (Standard Packets)

### 3.1. Dữ liệu cảm biến (Microcontroller -> Gateway)
* Nhiệt độ: `!1:TEMP:28#`
* Độ ẩm không khí: `!1:HUMI:65#`
* Độ ẩm đất: `!1:SOIL:42#`

### 3.2. Lệnh điều khiển (Gateway -> Microcontroller)
* Bật bơm: `!1:PUMP:ON#`
* Tắt bơm: `!1:PUMP:OFF#`
* Bật đèn: `!1:LED:ON#`
* Tắt đèn: `!1:LED:OFF#`
