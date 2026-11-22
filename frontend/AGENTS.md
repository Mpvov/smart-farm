# Frontend — Luật cho Agent

- **Phạm vi:** Thiết kế UI wireframe (`mockups/`) và mã nguồn giao diện cho đúng 10 màn hình (`SCR-01` → `SCR-10`) trong `docs/USE_CASES.md`.
- **Input / Output:** Input là đặc tả màn hình từ `docs/USE_CASES.md`, payload từ `contracts/api.md` và mẫu từ `contracts/samples/`; Output là wireframe trong `frontend/mockups/` và UI components.
- **File được sửa:** Chỉ sửa các file bên trong `frontend/`. Không tự ý thêm màn hình ngoài danh sách.
- **Không dùng dropdown/tooltip mặc định của trình duyệt (`<select>`, thuộc tính `title`):** Luôn dùng `src/components/ui/Select.tsx` và `src/components/ui/Tooltip.tsx` để đồng bộ Design System (Sunlight & Dark) và tránh giao diện OS vỡ thẩm mỹ.
- **Hover/Tooltip phải hướng dẫn hành động (Guide-first):** Mọi nút icon-only hoặc thao tác không hiển nhiên (ghim mặc định, đổi chế độ, chuyển dạng xem, xóa) phải có tooltip giải thích rõ **kết quả xảy ra khi bấm**, không chỉ lặp lại tên nút.
