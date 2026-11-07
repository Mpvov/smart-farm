# Firmware — Luật cho Agent

- **Phạm vi:** Mã nguồn nạp cho vi điều khiển (Yolo:bit / Micro:bit): đọc cảm biến, hiển thị màn hình LCD và giao tiếp UART Serial theo `contracts/uart.md`.
- **Input / Output:** Input là tín hiệu cảm biến phần cứng và lệnh Serial nhận từ Gateway; Output là gói tin đo đạc gửi qua UART Serial và tín hiệu điều khiển cơ cấu chấp hành tại chỗ.
- **File được sửa:** Chỉ sửa các file bên trong `firmware/`. Không tự ý đổi format gói tin UART ngoài đặc tả trong `contracts/uart.md`.
