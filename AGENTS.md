# Smart Farm — Luật cho Agent

Đọc file này trước. Làm trong thư mục nào thì đọc thêm `AGENTS.md` của thư mục đó.

## Layout

| Path | Chứa gì | Phụ trách |
| :--- | :--- | :--- |
| `frontend/` | UI + wireframe (`frontend/mockups/`). Gọi API theo `contracts/api.md` | P |
| `backend/` | API, CSDL, Audit Log, phân quyền | P |
| `gateway/` | UART Serial ↔ MQTT Adafruit IO | N, Q |
| `firmware/` | Code nạp vi điều khiển (đọc cảm biến, LCD, giao tiếp UART theo `contracts/uart.md`) | N, Q |
| `contracts/` | Format dữ liệu dùng chung: `contracts/uart.md`, `contracts/mqtt.md`, `contracts/api.md`, mẫu trong `contracts/samples/`, test | Cả nhóm duyệt |
| `docs/` | Use case, kiến trúc, quyết định, tiến độ | P |
| `scripts/` | `scripts/check.ps1`, `scripts/setup.ps1`, `scripts/worktree.ps1` | P |
| `report/` | Báo cáo LaTeX chính thức | P |

## Lệnh

- Lần đầu sau khi clone (bật Git hooks `.githooks/` và gắn junction Claude Code):
  `powershell -ExecutionPolicy Bypass -File scripts/setup.ps1`
- Tạo/gộp worktree làm việc (theo `.agents/skills/git-workflow/SKILL.md`):
  `powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 new <type>/<ten-ngan>`
  `powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 merge <type>/<ten-ngan>`
- Kiểm trước khi báo xong (phải ra OK, exit 0):
  `powershell -ExecutionPolicy Bypass -File scripts/check.ps1`
- Lỗi do môi trường (thiếu tool, quyền, port): báo lỗi và dừng, không tự đổi cấu hình máy.

## Luật cứng

1. Doc đi cùng code, trong cùng một commit:
   - Đổi format UART / MQTT / API: sửa `contracts/` + `contracts/samples/` + test.
   - Đổi hành vi (tính năng mới, sửa logic): sửa `docs/REQUIREMENTS.md`; commit message ghi ID, ví dụ `feat(gateway): FR-XX-NN đọc độ ẩm đất`.
   Vì: doc sửa "sau" thì không bao giờ được sửa; gateway và backend do người khác nhau viết, chỉ khớp nhau qua doc.
2. Không commit `.env` hay key thật. `.env.example` chỉ chứa tên biến, không chứa giá trị thật.
   Vì: có AIO key là điều khiển được thiết bị thật.
3. Chỉ làm màn hình và use case có trong `docs/USE_CASES.md`.
   Vì: phạm vi bám barem môn học; màn ngoài danh sách không được điểm và tốn thời gian.
4. Không đổi CSDL hay thêm thư viện lớn khi chưa có file trong `docs/decisions/`.
   Vì: đổi CSDL giữa chừng phải viết lại backend và báo cáo.
5. Không sửa `report/` khi chưa được yêu cầu.
   Vì: report là bản nộp chính thức.
6. Mỗi việc một worktree hoặc branch riêng (`<type>/<ten-ngan>`) tạo qua `scripts/worktree.ps1`. Thư mục gốc luôn giữ ở `main` sạch; không commit hay push thẳng lên `main`. Commit message theo Conventional Commits: `<type>(<scope>): <mô tả>`.
   Vì: nhiều người và nhiều agent cùng sửa một repo; Git hooks (`.githooks/pre-commit`, `.githooks/commit-msg`) tự chặn nếu vi phạm.
7. Thư mục mới ở gốc repo: thêm một dòng vào bảng Layout, tạo `<thư mục>/AGENTS.md` và `<thư mục>/CLAUDE.md` (chỉ chứa `@AGENTS.md`). Ngoại lệ: `docs/`, `scripts/`, `report/`.
   Vì: agent chỉ biết luật của thư mục khi file đó tồn tại; check.ps1 kiểm luật này.

## Khi nào hỏi, khi nào tự làm

- Phải hỏi trước: đổi contract, đổi CSDL, thêm màn hình hay use case, đụng secret, sửa file ngoài thư mục được giao.
- Tự quyết: tên biến, cách tổ chức code bên trong module, nội dung test.
- Phải kiểm tài liệu chính thức (web) trước khi dùng: API Adafruit IO, thư viện ngoài, phiên bản tool. Ghi link nguồn trong câu trả lời.

## Tài liệu

Bản đồ tài liệu: `docs/README.md`. Mỗi loại thông tin chỉ ở một file trong bảng đó. Tra bảng trước khi ghi gì vào docs.
