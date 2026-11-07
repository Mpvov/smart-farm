# Bản đồ tài liệu

Mỗi loại thông tin chỉ nằm ở **một** file. Trước khi ghi gì vào docs, tra bảng này.
Không có dòng phù hợp → hỏi người dùng. Không tự tạo file mới.

| Loại thông tin | File duy nhất | ID |
| :--- | :--- | :--- |
| Mục tiêu, phạm vi, tiêu chí chấm, thuật ngữ | `docs/KNOWLEDGE.md` | — |
| Use case | `docs/USE_CASES.md` | `UC` (UC + số) |
| Yêu cầu người dùng | `docs/USE_CASES.md` | `UR` (UR + số) |
| Màn hình | `docs/USE_CASES.md` | `SCR` (SCR + số) |
| Yêu cầu chức năng | `docs/REQUIREMENTS.md` | `FR` (FR + mã module + số) |
| Yêu cầu phi chức năng | `docs/REQUIREMENTS.md` | `NFR` (NFR + số) |
| Kiến trúc, luồng dữ liệu giữa các phần | `docs/ARCHITECTURE.md` | — |
| Quyết định khó đổi (CSDL, framework, thư viện lớn) | `docs/decisions/` (mỗi quyết định một file `NNNN-ten-ngan.md`) | số đầu tên file |
| Tiến độ, phân công | `docs/PROGRESS.md` | — |
| Kế hoạch thực thi chi tiết | `docs/plans/` | — |
| Tài liệu gốc từ bên ngoài (đề bài, đề cương, timeline, giáo trình, báo cáo mẫu, ảnh thiết bị) — chỉ đọc, không sửa | `docs/sources/` | — |
| Format dữ liệu giữa các phần | `contracts/` (không nằm trong docs) | — |
| Luật cho agent | `AGENTS.md` (không nằm trong docs) | — |

## Mã module

| Mã | Module |
| :--- | :--- |
| FW | firmware |
| GW | gateway |
| BE | backend |
| FE | frontend |

## Luật

1. Một thông tin, một chỗ. File khác chỉ ghi ID hoặc đường dẫn, không chép lại nội dung.
2. Định nghĩa một mục đúng một lần, trong file của nó, ở đầu dòng. Một trong hai dạng:
   - Khối: dòng bắt đầu `**FR-XX-NN · Tên ngắn**`
   - Bảng: hàng bắt đầu `| UC-NN |`
3. ID không bao giờ đổi, không tái dùng.
   - Bỏ một mục: giữ nguyên, thêm "(bỏ, YYYY-MM-DD: lý do)".
   - Thay một mục: thêm mục mới, ghi "(thay bởi <ID mới>)" ở mục cũ.
4. ID mới = số lớn nhất của loại đó + 1. Không lấp số trống.
5. Nhắc tới một mục thì ghi ID đầy đủ, không ghi tên.
6. Mỗi FR có dòng "Phục vụ: <ID use case>" để biết nó sinh ra từ use case nào.
7. Thông tin đổi: sửa tại chỗ. Không để bản cũ cạnh bản mới, không ghi "(cũ)".
8. Đổi hành vi trong code → sửa file trong bảng trong cùng commit.
9. Loại ID mới (ví dụ màn hình): check in WARN "ID lạ". Khi đó đề xuất MỘT hàng mới cho bảng
   (loại thông tin, file gốc, tiền tố trong backtick) và hỏi người dùng. Được đồng ý thì thêm hàng,
   tạo file gốc, rồi chạy lại check. Không sửa `scripts/check.ps1`: check tự đọc bảng này.
10. File trong `docs/sources/` là bản gốc, không sửa, không xoá. Thông tin cần dùng thì tóm vào file đúng trong bảng, kèm đường dẫn tới bản gốc.

`scripts/check.ps1` kiểm luật 1–5 và 9: file docs ngoài bảng, ID định nghĩa hai lần hoặc ngoài file của nó, ID nhắc tới mà chưa định nghĩa, tên file quyết định sai.
