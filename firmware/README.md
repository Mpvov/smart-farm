# Firmware Yolo:Bit (`FR-FW-01`)

Mã nguồn nạp cho bo mạch **Yolo:Bit** (soạn bằng OhStem Blockly trong [SmartFarm.json](SmartFarm.json), mã MicroPython trích xuất tương ứng ở [main.py](main.py)).

## Sơ đồ kết nối phần cứng

| Thiết bị | Chân / Giao tiếp | Ghi chú |
| :--- | :--- | :--- |
| Cảm biến nhiệt độ & độ ẩm `DHT20` | I2C (`P19`/`P20`) | Đo `TEMP` (°C) và `HUMI` (%) |
| Cảm biến độ ẩm đất | `P1` (Analog) | Quy đổi `0–4095` sang `0–100%` (`SOIL`) |
| Cảm biến ánh sáng | `P2` (Analog) | Quy đổi `0–4095` sang `0–100%` (`LIGHT`) |
| Màn hình `LCD 16x2` | I2C | Hiển thị `T:...H:...` và `S:...L:...` |
| Máy bơm / Relay | `P0` (Digital) | `1` = BẬT, `0` = TẮT |
| Đèn 4 LED RGB | `P16` | Trắng (`#ffffff`) = BẬT, Đen (`#000000`) = TẮT |
| Nút nhấn trên mạch | Nút `A` / Nút `B` | Đảo trạng thái `PUMP` / `LED` tại chỗ và gửi UART lên Gateway |

## Giao tiếp UART (`115200 bps`, `contracts/uart.md`)

- Chu kỳ gửi cảm biến: **15 giây/lần** (`!1:TEMP:...#`, `!1:HUMI:...#`, `!1:SOIL:...#`, `!1:LIGHT:...#`).
- Lệnh điều khiển nhận từ Gateway: `!1:PUMP:ON#`, `!1:PUMP:OFF#`, `!1:LED:ON#`, `!1:LED:OFF#`.
- Phản hồi khi nhấn nút `A` / `B` tại chỗ: `!1:PUMP:ON#`, `!1:PUMP:OFF#`, `!1:LED:ON#`, `!1:LED:OFF#`.
