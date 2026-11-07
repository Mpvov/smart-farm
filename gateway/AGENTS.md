# Gateway — Luật cho Agent & Thành viên (Bạn B & C)

## 1. Phạm vi trách nhiệm
* Thư mục này chứa mã nguồn Python giao tiếp giữa Mạch vi điều khiển (UART Serial) và Broker IoT (MQTT Adafruit IO).

## 2. Luật cứng (Hard Rules)
1. **Tuân thủ tuyệt đối Contract:**
   * Chuỗi Serial UART gửi/nhận bắt buộc tuân theo [`contracts/uart.md`](../contracts/uart.md) (`!1:TEMP:28#`, `!1:PUMP:ON#`...).
   * Tên Feeds và payload MQTT bắt buộc tuân theo [`contracts/mqtt.md`](../contracts/mqtt.md).
   * **Nghiêm cấm tự ý thay đổi format gói tin**. Nếu muốn đổi format, phải thông qua nhóm và sửa cả contract + samples + test trước.
2. **Bảo mật AIO Key:**
   * Đọc `AIO_USERNAME` và `AIO_KEY` từ file `.env` (qua `python-dotenv`). Tuyệt đối không commit key thật lên Git.
3. **Kiểm thử trước khi bàn giao:**
   * Chạy `./scripts/check.ps1` và xác nhận script test contract xanh hoàn toàn (`exit 0`).
