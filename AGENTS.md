# Smart Farm — Luật cho Agent

## 1. Layout & Trách nhiệm
| Path | Trách nhiệm | Người phụ trách |
| :--- | :--- | :--- |
| `frontend/` | UI + Wireframe Mockup | Leader |
| `backend/` | API + CSDL + Audit Log | Leader |
| `gateway/` | UART Serial ↔ MQTT Adafruit IO | Bạn B & Bạn C |
| `contracts/` | Đặc tả format dữ liệu + Mẫu test | Cả nhóm thống nhất |
| `report/` | Báo cáo LaTeX chính thức | Không sửa khi chưa được yêu cầu |

## 2. Lệnh bắt buộc
- Kiểm tra trước khi báo xong: `./scripts/check.ps1` (bắt buộc trả về exit 0).

## 3. Luật cứng (Hard Rules)
1. Format UART / MQTT / API chỉ lấy từ `contracts/`. Muốn đổi format thì phải sửa đồng thời contract + samples + test.
2. Không commit file `.env` hay key thật. Mọi thiết lập chỉ ghi vào `.env.example`.
3. Chỉ làm màn hình và use case được liệt kê trong `docs/USE_CASES.md`.
4. Không đổi CSDL hay cài thêm thư viện lớn khi chưa có file trong `docs/decisions/`.
5. Thiếu thông tin thì hỏi, tuyệt đối không tự suy diễn.
6. Tri thức chi tiết đọc tại `docs/KNOWLEDGE.md`, tiến độ theo dõi tại `docs/PROGRESS.md`.
