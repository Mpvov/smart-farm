---
name: git-workflow
description: Quy trinh Git Branch, Worktree (.worktrees/) va Conventional Commits cho Agent tren repo Smart Farm. Kich hoat khi bat dau mot dau viec moi, tao/gop/xoa worktree, hoac commit code/docs.
---

# Quy trình Git & Worktree cho Agent

Thư mục gốc (`D:\DADN`) luôn giữ ở nhánh `main` sạch. Mọi công việc mới đều thực hiện trên worktree riêng trong `.worktrees/<slug>` (hoặc branch riêng nếu chỉ làm 1 việc nhỏ độc lập).

## 1. Bắt đầu công việc mới (Tạo Worktree)

Chạy lệnh tạo worktree từ `main` (tự động tạo nhánh `<type>/<ten-ngan>` và gắn junction `.claude/`):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 new <type>/<ten-ngan>
```

- `<type>` hợp lệ: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `ci`, `build`.
- Ví dụ:
  - `powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 new docs/use-case-detail`
  - `powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 new feat/gateway-uart`
- Worktree được tạo tại `.worktrees/<type>-<ten-ngan>`. Mọi thao tác đọc/sửa/chạy lệnh của task đó thực hiện bên trong thư mục worktree này.

## 2. Kiểm tra và Commit trong Worktree

Trước khi commit, chạy lệnh kiểm tại worktree (hoặc để Git hook `.githooks/pre-commit` tự chạy):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check.ps1
```

Commit theo chuẩn **Conventional Commits** (kiểm tự động bởi `.githooks/commit-msg`):

```text
<type>(<scope>): <mô tả ngắn>
```

- Nếu đổi hành vi / thêm tính năng trong module code (`firmware`, `gateway`, `backend`, `frontend`), bắt buộc ghi kèm ID yêu cầu:
  - Ví dụ: `feat(gateway): FR-GW-01 doc do am dat qua UART`
  - Ví dụ: `docs(uc): hoan thien dac ta UC-01 den UC-04`

## 3. Gộp về `main` và dọn Worktree

Khi đã commit xong trong worktree và `check.ps1` báo `OK agent files`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 merge <type>/<ten-ngan>
```

Lệnh `merge` sẽ tự động:
1. Kiểm tra thư mục gốc đang ở `main` sạch và worktree không còn file dở dang.
2. Chạy lại `scripts/check.ps1` trong worktree.
3. Merge nhánh vào `main`.
4. Gỡ junction `.claude/` an toàn, xóa thư mục `.worktrees/<slug>` và xóa nhánh tạm.

## 4. Các lệnh phụ trợ

- Xem danh sách worktree đang mở:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 list
  ```
- Chỉ dọn worktree mà không merge:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 done <type>/<ten-ngan>
  ```
