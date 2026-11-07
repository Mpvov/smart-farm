# MQTT Contract (Adafruit IO)

Quy chuẩn giao tiếp MQTT giữa IoT Gateway (Python), Adafruit IO Broker và Hệ thống ứng dụng (Web/Backend).

---

## 1. Thông tin kết nối (Broker Connection)
* **Broker Host:** `io.adafruit.com`
* **Port:** `1883` (TCP không mã hóa) hoặc `8883` (SSL/TLS)
* **Authentication:**
  * Username: `AIO_USERNAME` (lấy từ `.env`)
  * Password: `AIO_KEY` (lấy từ `.env`)

---

## 2. Danh mục Feeds & Topics

Định dạng topic chuẩn của Adafruit IO:
```text
<AIO_USERNAME>/feeds/<FEED_KEY>
```

| Feed Key | Loại | Ý nghĩa | Kiểu dữ liệu | Giá trị hợp lệ |
| :--- | :---: | :--- | :---: | :--- |
| `smartfarm-temp` | Input | Nhiệt độ môi trường | Float / Int | `-10.0` đến `60.0` (°C) |
| `smartfarm-humi` | Input | Độ ẩm không khí | Float / Int | `0.0` đến `100.0` (%) |
| `smartfarm-soil` | Input | Độ ẩm đất | Float / Int | `0.0` đến `100.0` (%) |
| `smartfarm-pump` | Output | Điều khiển máy bơm | String ("0"/"1") | `"1"` (Bật), `"0"` (Tắt) |
| `smartfarm-led` | Output | Điều khiển đèn cảnh báo | String ("0"/"1") | `"1"` (Bật), `"0"` (Tắt) |

---

## 3. Quy tắc Publish & Subscribe

1. **Gateway gửi dữ liệu cảm biến (Publish):**
   * Khi nhận gói tin `!1:TEMP:28#` từ UART $\rightarrow$ Publish giá trị `"28"` lên `<username>/feeds/smartfarm-temp`.
   * Tần suất gửi cảm biến: Định kỳ mỗi 10 giây/lần.
2. **Gateway nhận lệnh điều khiển (Subscribe):**
   * Subscribe vào feeds: `<username>/feeds/smartfarm-pump` và `<username>/feeds/smartfarm-led`.
   * Khi nhận `"1"` từ feed `smartfarm-pump` $\rightarrow$ Gửi gói UART `!1:PUMP:ON#` xuống mạch vi điều khiển.
   * Khi nhận `"0"` từ feed `smartfarm-pump` $\rightarrow$ Gửi gói UART `!1:PUMP:OFF#` xuống mạch vi điều khiển.
