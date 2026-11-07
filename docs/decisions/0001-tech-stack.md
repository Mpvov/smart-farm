# 0001. Tech Stack cho Backend và Frontend

* Trạng thái: Đã duyệt
* Ngày: 2026-11-07
* Người quyết định: P, Cả nhóm

## Bối cảnh

Hệ thống cần triển khai phiên bản chạy thật với UI/UX hoàn thiện để cả nhóm thử nghiệm và lấy phản hồi trước khi tích hợp sâu với phần cứng của N và Q. Hệ thống cần đảm bảo khả năng hiển thị responsive (Desktop và Mobile), xử lý dữ liệu vi khí hậu realtime và báo cáo động HTTT.

## Quyết định

1. **Backend (Tạm thời phục vụ prototype chạy thật):**
   - Framework: **Python FastAPI** (async non-blocking, OpenAPI tự động).
   - CSDL: **SQLite** (nhẹ, zero-config, lưu file cục bộ, dễ seed dữ liệu mẫu).
   - Realtime Streaming: **FastAPI Background Tasks + SSE (Server-Sent Events) / WebSocket** để sinh và phát dữ liệu cảm biến giả lập.

2. **Frontend (Chạy thật, Responsive Web cho 10 màn hình `SCR-01` → `SCR-10`):**
   - Nền tảng: **React + Vite + TypeScript**.
   - Styling & UI Components: **Tailwind CSS**, **shadcn/ui**, **Lucide React**.
   - Thông báo: **Sonner** (Toast cảnh báo sự cố xếp chồng).
   - Biểu đồ duy nhất: **Apache ECharts** (canvas rendering hiệu năng cao cho cả biểu đồ realtime và báo cáo phân tích).
   - Xử lý bảng & ngày giờ: **TanStack Table** (phân trang, lọc, sắp xếp cho HTTT), **date-fns**.
   - Quản lý trạng thái: **TanStack Query** (cache dữ liệu API REST), **Zustand** (buffer dữ liệu nóng SSE/WebSocket).

3. **Loại bỏ theo nguyên tắc Ponytail Ultra (YAGNI):**
   - *Tremor:* Bỏ để tránh nạp 2 chart engines (dùng ECharts và shadcn/ui Card thay thế).
   - *TanStack Virtual:* Bỏ vì bảng HTTT sử dụng phân trang (Pagination 10-50 dòng/trang), không dùng Infinite Scroll 10.000 dòng.
   - *nuqs:* Bỏ vì `useSearchParams` chuẩn của `react-router-dom` đã đủ để lưu filter lên URL.

## Hệ quả

- Gói bundle Frontend nhẹ, không bị xung đột thư viện hay phình kích thước.
- Backend có thể chạy độc lập, triển khai nhanh trên cloud mà không phụ thuộc hạ tầng Kafka hay máy chủ CSDL phức tạp.
- Khi N và Q hoàn thiện phần cứng và backend chính thức, có thể hoán đổi CSDL và nguồn cấp dữ liệu mà không ảnh hưởng tới giao diện UI/UX.
