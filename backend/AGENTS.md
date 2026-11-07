# Backend — Luật cho Agent

## 1. Phạm vi trách nhiệm
* Thư mục này phụ trách thiết kế CSDL (PostgreSQL), API Service và xử lý nghiệp vụ HTTT.
* Trọng tâm bắt buộc: Toàn vẹn dữ liệu, bảng Audit Log bất biến và API tổng hợp báo cáo đa chiều theo barem khoa CSE.

## 2. Luật cứng (Hard Rules)
1. **Cơ sở dữ liệu:** Cố định PostgreSQL theo [`docs/decisions/0001-database.md`](../docs/decisions/0001-database.md). Cấm tự ý đổi sang SQLite/MongoDB.
2. **API Contracts:** Payload gửi/nhận phải tương thích 100% với định dạng quy định tại [`contracts/`](../contracts/).
3. **Audit Log:** Mọi API thay đổi cấu hình, tạo/sửa người dùng hoặc điều khiển thiết bị bắt buộc ghi 1 record vào bảng `audit_logs` (User ID, Action, Timestamp, Details, IP).
4. **Không lưu Key thật:** Mọi thông tin nhạy cảm đọc từ biến môi trường qua `.env`, cấm hardcode key vào source code.
