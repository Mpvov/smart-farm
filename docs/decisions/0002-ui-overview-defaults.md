# 0002. Chuẩn IA, Overview 3 tầng và Nguyên tắc Sensible Defaults cho UI

* Trạng thái: Đã duyệt
* Ngày: 2026-11-22
* Người quyết định: P

## Bối cảnh

Frontend phục vụ đúng 10 màn hình (`SCR-01` → `SCR-10`) trong `docs/USE_CASES.md`. Trước Phase 1, thanh điều hướng còn phẳng, lệch phân quyền vai trò (`Admin` vs `Operator`), chưa hỗ trợ đủ màn hình trên thiết bị di động và `SCR-02` thiếu luồng xem tổng quan đa trang trại. Đồng thời cần chốt ranh giới rõ ràng giữa phần giao diện chính thức và lớp dữ liệu realtime tạm thời đang dùng để phát triển UI/UX.

## Quyết định

1. **Kiến trúc thông tin (IA) & RBAC (`frontend/src/config/navigation.ts`):**
   - Tổ chức 9 màn hình sau đăng nhập thành 3 nhóm: **Vận hành** (`SCR-02`, `SCR-03`, `SCR-05`), **Phân tích** (`SCR-06`, `SCR-07`), và **Quản trị** (`SCR-04`, `SCR-09`, `SCR-10`, `SCR-08`).
   - Lọc menu và chặn truy cập trực tiếp trong `App.tsx` khớp chặt ma trận phân quyền của `docs/USE_CASES.md` (`SCR-04`, `SCR-07`, `SCR-08`, `SCR-09`, `SCR-10` chỉ dành cho `ADMIN`).
   - Thanh `Header` ẩn hoặc hiện bộ chọn `Farm`/`Zone` theo `contextScope` (`global`, `farm`, `farm-zone`) của từng màn hình.

2. **Overview 3 tầng Progressive Drill-down (`SCR-02`, phục vụ `UC-06`, `FR-FE-01`, `FR-FE-03`):**
   - Tầng 0 (Portfolio Farm) → Tầng 1 (Lưới Zone thuộc Farm) → Tầng 2 (Chi tiết Zone gồm 3 tab: *Realtime & Biểu đồ*, *Cấu hình & Thiết bị* chỉ-đọc kèm điều hướng nhanh sang `SCR-03`/`SCR-04`, và *Hồ sơ Zone*).
   - Tự động mở thẳng Tầng 1 nếu hệ thống chỉ có 1 Farm hoặc người dùng đã ghim `defaultFarmId` (lưu tại `localStorage`); ẩn bộ chọn Farm/Zone trên `Header` khi ở `SCR-02` để tránh trùng lặp.

3. **Sensible Defaults và Bounded Customization (`frontend/src/config/dashboard.ts`):**
   - 4 thẻ cảm biến trên `SCR-02` khóa cứng hiển thị **giá trị tức thời mới nhất (Latest)** kèm mốc thời gian cập nhật. Không dùng giá trị trung bình 24 giờ hay 30 phút vì phép tính trung bình sẽ làm phẳng các đột biến nguy hiểm (`UR-01`, `FR-FE-01`).
   - Biểu đồ xu hướng hỗ trợ tập preset giới hạn `1h | 6h | 24h | 7d` (mặc định `24h`); thống kê tổng hợp `Min/Max/Avg` tách riêng sang màn báo cáo `SCR-06`.
   - Các tham số mang tính nghiệp vụ riêng theo từng trang trại hoặc cây trồng (Farm mặc định, ngưỡng cảnh báo và lịch trình tại `SCR-04`) do người dùng tự cấu hình.

4. **Quy ước lớp Realtime Transport tạm thời (cho mọi Agent về sau):**
   - Hiện chưa có quyết định kiến trúc chính thức cho giao thức truyền dữ liệu realtime giữa Backend và Frontend chính thức.
   - Luồng SSE hiện tại chỉ là **prototype hỗ trợ phát triển UI/UX** theo `docs/decisions/0001-tech-stack.md`.
   - Mọi component giao diện phải đăng ký stream thông qua adapter `subscribeZoneTelemetry` trong `frontend/src/lib/api.ts`, không khởi tạo trực tiếp `EventSource` trong component UI để có thể hoán đổi sang WebSocket, MQTT over WebSocket hoặc Polling tại một điểm duy nhất.

## Hệ quả

- Giao diện giữ được mức đơn giản khi mở đầu nhưng vẫn đầy đủ chiều sâu theo từng tầng drill-down, tránh quá tải nhận thức do tùy biến quá mức.
- Cấu hình mặc định của Dashboard và Navigation tập trung tại `frontend/src/config/` giúp giảm lặp logic giữa các màn hình.
- Mọi agent tham gia sau này nhìn vào thư mục `docs/decisions/` và `frontend/src/lib/api.ts` sẽ nhận biết rõ lớp SSE là tạm thời và biết đúng vị trí để thay thế khi chốt kiến trúc realtime chính thức.
