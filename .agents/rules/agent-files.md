# Khi sửa AGENTS.md, CLAUDE.md, rule hoặc skill

- Một nguồn luật: AGENTS.md. CLAUDE.md chỉ chứa `@AGENTS.md`. Không tạo GEMINI.md trong repo.
- Bảng Layout chỉ ghi "chứa gì". Luật đặt ở mục Luật cứng.
- Cột phụ trách ghi tên thật.
- Mọi đường dẫn nhắc tới phải tồn tại.
- Lệnh phải chạy được trên Windows: `powershell -ExecutionPolicy Bypass -File ...`.
- README.md là cho người đọc. Luật cho agent đặt trong AGENTS.md.
- Sửa xong chạy scripts/check.ps1, phải ra OK.

# Nơi lưu bài học khi chạy /learn

| Bài học về | Lưu vào |
| :--- | :--- |
| Văn phong, sở thích riêng của tôi | `~/.gemini/GEMINI.md` (toàn cục, không commit) |
| Luật chung cả repo | `AGENTS.md` gốc, mục Luật cứng |
| Riêng một module | `<module>/AGENTS.md` (frontend, backend, gateway, contracts) |
| Cách viết file agent | file này |
| Quy trình nhiều bước hay lặp lại | `.agents/skills/<tên>/SKILL.md` |

- Trước khi thêm: tìm luật trùng. Có thì sửa luật cũ, không thêm dòng mới.
- Mỗi bài học một dòng, dạng mệnh lệnh, kèm lý do ngắn.
- Bài học kiểm được bằng lệnh: đề xuất thêm vào `scripts/check.ps1`.
- Module mới chưa có AGENTS.md: tạo kèm `CLAUDE.md` chứa `@AGENTS.md`.
