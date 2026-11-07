# Smart Farm — Luật cho Agent

Đọc file này trước. Làm trong thư mục nào thì đọc thêm `AGENTS.md` của thư mục đó.

## Layout

| Path | Chứa gì | Phụ trách |
| :--- | :--- | :--- |
| `frontend/` | UI + wireframe (`frontend/mockups/`). Gọi API theo `contracts/api.md` | P |
| `backend/` | API, CSDL, Audit Log, phân quyền | P |
| `gateway/` | UART Serial ↔ MQTT Adafruit IO | N, Q |
| `contracts/` | Format dữ liệu dùng chung: `contracts/uart.md`, `contracts/mqtt.md`, `contracts/api.md`, mẫu trong `contracts/samples/`, test | Cả nhóm duyệt |
| `docs/` | Use case, kiến trúc, quyết định, tiến độ | P |
| `scripts/` | `scripts/check.ps1` | P |
| `report/` | Báo cáo LaTeX chính thức | P |

## Lệnh

- Kiểm trước khi báo xong (phải ra OK, exit 0):
  `powershell -ExecutionPolicy Bypass -File scripts/check.ps1`
- Lỗi do môi trường (thiếu tool, quyền, port): báo lỗi và dừng, không tự đổi cấu hình máy.

## Luật cứng

1. Format UART / MQTT / API chỉ lấy từ `contracts/`. Đổi format thì sửa contract + `contracts/samples/` + test trong cùng một commit.
2. Không commit `.env` hay key thật. `.env.example` chỉ chứa tên biến, không chứa giá trị thật.
3. Chỉ làm màn hình và use case có trong `docs/USE_CASES.md`.
4. Không đổi CSDL hay thêm thư viện lớn khi chưa có file trong `docs/decisions/`.
5. Không sửa `report/` khi chưa được yêu cầu.
6. Mỗi việc một branch. Không push thẳng lên `main`.

## Khi nào hỏi, khi nào tự làm

- Phải hỏi trước: đổi contract, đổi CSDL, thêm màn hình hay use case, đụng secret, sửa file ngoài thư mục được giao.
- Tự quyết: tên biến, cách tổ chức code bên trong module, nội dung test.

## Tài liệu

- Use case và màn hình: `docs/USE_CASES.md`
- Kiến trúc và luồng dữ liệu: `docs/ARCHITECTURE.md`
- Quyết định đã chốt: `docs/decisions/`
- Tri thức môn học: `docs/KNOWLEDGE.md`
- Tiến độ và phân công: `docs/PROGRESS.md`
