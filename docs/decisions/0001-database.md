# 0001. Lựa chọn Cơ sở dữ liệu: PostgreSQL

**Ngày quyết định:** 2026-11-07  
**Trạng thái:** Đã chấp thuận (Accepted)  
**Người quyết định:** Nhóm 4 (CO3111 - Hướng HTTT)

---

## 1. Bối cảnh (Context)
Đề tài Smart Farm yêu cầu lưu trữ và xử lý hai nhóm dữ liệu chính:
1. Dữ liệu chuỗi thời gian từ cảm biến (Time-series telemetry: nhiệt độ, độ ẩm mỗi 10 giây).
2. Dữ liệu nghiệp vụ quan hệ cốt lõi của Hệ Thống Thông Tin (HTTT): Quản lý phân quyền người dùng, danh mục khu vườn canh tác, thiết lập ngưỡng, nhật ký hoạt động bất biến (Audit Log), và đặc biệt là truy vấn tổng hợp phục vụ báo cáo trực quan đa chiều (Báo cáo theo thời gian, theo mảnh vườn, theo trạng thái).

---

## 2. Các phương án cân nhắc (Options Considered)
* **Phương án 1 - SQLite:** Đơn giản, không cần server riêng, nhưng không phù hợp môi trường đa người dùng và hạn chế tính năng phân tích dữ liệu nâng cao.
* **Phương án 2 - MongoDB (NoSQL):** Linh hoạt lưu telemetry, nhưng rất yếu trong việc đảm bảo toàn vẹn tham chiếu cho phân quyền RBAC và bảng Audit Log; không sát với barem đánh giá CSDL quan hệ chuẩn hóa (ERD 3NF) của Khoa CSE.
* **Phương án 3 - PostgreSQL (Được chọn):** Hệ quản trị CSDL quan hệ mã nguồn mở mạnh mẽ nhất, hỗ trợ kiểu dữ liệu JSON, tối ưu cực tốt cho các truy vấn tổng hợp báo cáo phức tạp (Window Functions, Aggregations) và đảm bảo tính toàn vẹn ACID tuyệt đối cho Audit Log.

---

## 3. Quyết định (Decision)
**Nhóm chọn PostgreSQL làm hệ quản trị CSDL chính thức của dự án.**

Lý do:
1. Phù hợp 100% với định hướng chuyên ngành Hệ Thống Thông Tin (HTTT) và barem chấm điểm thiết kế CSDL quan hệ.
2. Cung cấp khả năng ghi và truy vấn Audit Log bất biến với độ tin cậy cao.
3. Hỗ trợ sẵn các hàm tổng hợp thời gian (`date_trunc`, `avg`, `min`, `max`) giúp Backend dễ dàng xuất báo cáo đa chiều sang Excel/CSV/PDF cho Module 5.

---

## 4. Hệ quả & Quy tắc cho Agent (Consequences & Agent Rules)
* Agent **tuyệt đối không tự ý đổi sang NoSQL hoặc CSDL khác** trừ khi có ADR mới phê duyệt.
* Thiết kế schema phải tuân thủ chuẩn quan hệ (Foreign Keys, Indexes cho các cột tìm kiếm như `zone_id`, `created_at`).
