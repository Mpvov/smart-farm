# Cách làm việc với git

Áp dụng cho người và agent. Ý chính: **bắt đầu từ `origin/main` mới nhất, rebase thay vì merge, không push thẳng `main`.**
*(Ghi chú: hiện repo chưa có remote; khi chưa có, thay `origin/main` bằng `main`.)*

## 1. Bắt đầu một việc

```bash
git fetch origin
git switch -c <loại>/<tên-ngắn> origin/main
```

Khi chạy song song nhiều agent (mỗi agent một worktree trong `.worktrees/`):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 new <loại>/<tên-ngắn>
```

- Xem các worktree đang mở: `powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 list`
- Xong việc (dọn worktree): `powershell -ExecutionPolicy Bypass -File scripts/worktree.ps1 done <loại>/<tên-ngắn>`

Loại: `feat/` tính năng · `fix/` sửa lỗi · `docs/` tài liệu · `chore/` dọn dẹp, cập nhật thư viện · `test/` chỉ thêm test.
Mỗi việc một branch. Không làm hai việc không liên quan trên cùng một branch.

## 2. Commit

- Mỗi commit một ý. Message: `type(scope): mô tả`, có ID yêu cầu nếu đổi hành vi.
  Ví dụ: `feat(gateway): FR-XX-NN gửi dữ liệu mỗi 10 giây`.
- Doc đi cùng code trong cùng commit (luật 1 trong `AGENTS.md`).

## 3. Trước khi push

```bash
git fetch origin
git rebase origin/main
powershell -ExecutionPolicy Bypass -File scripts/check.ps1
git push -u origin HEAD              # lần đầu
git push --force-with-lease          # sau khi rebase một branch đã push
```

`--force-with-lease` chỉ ghi đè khi remote đúng là bản bạn thấy lần cuối. Không dùng `--force` trần.

## 4. Pull request

- Mở PR vào `main`. Mô tả: làm gì, ID yêu cầu liên quan, kết quả `check.ps1`.
- Ít nhất một người khác đọc qua trước khi merge.
- Merge bằng **Squash and merge**, rồi xoá branch.
- `main` có commit mới trong lúc PR đang mở: rebase lại (mục 3), đừng merge `main` vào branch.

## 5. Conflict khi rebase

```bash
# sửa file bị conflict, rồi:
git add <file>
git rebase --continue
# muốn bỏ, quay về trước khi rebase:
git rebase --abort
```

Sửa xong chạy lại `check.ps1` trước khi push.

## 6. Không làm

- Push thẳng lên `main`.
- `git merge origin/main` hoặc `git pull` kiểu merge vào branch của mình.
- Force-push lên branch của người khác.
- Commit `.env`, key, mật khẩu.
- Mở hai agent trên cùng một thư mục làm việc. Cần chạy song song thì mỗi agent một worktree trong `.worktrees/` qua `scripts/worktree.ps1` (xem mục 1).

## 7. Hook

- `scripts/setup.ps1` bật `.githooks`.
- `pre-commit` chặn commit trên `main` và chạy `scripts/check.ps1`.
- `commit-msg` bắt dạng `type(scope): mô tả`.
- Không dùng `--no-verify`.

## 8. Cấu hình một lần

```bash
git config --global pull.rebase true
git config --global rebase.autoStash true
git config --global fetch.prune true
```

Chủ repo bật thêm trên GitHub: Settings → Branches → rule cho `main`: *Require a pull request before merging*.
