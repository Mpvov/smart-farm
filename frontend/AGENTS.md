# Frontend — Luật cho Agent

## 1. Phạm vi trách nhiệm
* Thư mục này chỉ phục vụ thiết kế UI Mockup, Wireframe và mã nguồn giao diện người dùng (Web/Mobile).
* Tuyệt đối không viết logic kết nối CSDL trực tiếp hoặc logic Gateway trong thư mục này.

## 2. Danh mục màn hình được phép làm (Strict Screen Scope)
Chỉ thực hiện đúng 8 màn hình trong [`docs/USE_CASES.md`](../docs/USE_CASES.md):
1. `SCR-01`: Đăng nhập & Xác thực (UC-01)
2. `SCR-02`: Giám sát thời gian thực Dashboard (UC-06)
3. `SCR-03`: Điều khiển thiết bị & Trạng thái (UC-07, UC-08)
4. `SCR-04`: Cấu hình Ngưỡng & Lịch trình (UC-09, UC-10)
5. `SCR-05`: Trung tâm Cảnh báo & Sự cố (UC-11)
6. `SCR-06`: Báo cáo động & Xuất dữ liệu HTTT (UC-12 - Trọng tâm)
7. `SCR-07`: Nhật ký hoạt động Audit Log (UC-05)
8. `SCR-08`: Quản lý tài khoản & Phân quyền (UC-02, UC-03)

Cấm tự ý vẽ thêm màn hình ngoài danh sách trên.

## 3. Quy chuẩn giao diện (Design System)
* Phong cách: *Operate* (Gọn gàng, dễ quét mắt, ưu tiên năng suất và trực quan hóa số liệu nông trại).
* Dữ liệu mẫu dùng cho mockup: Bắt buộc lấy từ [`contracts/samples/`](../contracts/samples/).
