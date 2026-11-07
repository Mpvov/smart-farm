# Gateway — Luật cho Agent

- **Phạm vi:** Script Python cầu nối hai chiều giữa cổng UART Serial (Yolo:bit) và MQTT Broker (Adafruit IO).
- **Input / Output:** Input là gói tin Serial theo `contracts/uart.md` và lệnh điều khiển từ `contracts/mqtt.md`; Output là dữ liệu publish lên feed MQTT và lệnh UART gửi xuống mạch.
- **File được sửa:** Chỉ sửa các file bên trong `gateway/`. Không tự đổi format gói tin.
