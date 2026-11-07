# KẾ HOẠCH CÁ NHÂN CỦA P (BÀI TOÁN → USE CASE → WIREFRAME → KIẾN TRÚC)

**Phạm vi của P:** Bài toán nghiệp vụ, Tài liệu Use Case (`docs/USE_CASES.md`, `report/section/UseCase.tex`), Wireframe UI (`frontend/mockups/`), và định hình `contracts/api.md` + `backend/` sau khi chốt UI.  
**Không nằm trong plan này:** Phần IoT Gateway & Adafruit IO của N và Q (`gateway/`).

---

## BƯỚC 1: CHỐT 4 CÂU HỎI BÀI TOÁN TÁC ĐỘNG ĐẾN USE CASE & UI

1. **Quy mô chủ thể (Tenancy):** Phục vụ **1 nông trại duy nhất** (gồm nhiều khu đất/mảnh vườn) hay **nhiều chủ nông trại** độc lập?
2. **Quan hệ Khu đất – Cây trồng – Lịch/Ngưỡng:** Theo đề tài gốc (*"mỗi khu đất/mảnh vườn có loại cây trồng khác nhau, mỗi loại cây trồng có lịch trình tắt mở và thiết lập cảnh báo khác nhau"*): Lịch trình & ngưỡng gắn theo **Loại cây trồng** (áp cho mảnh vườn trồng cây đó) hay gắn trực tiếp trên từng **Mảnh vườn**?
3. **Phân cấp Thiết bị:** Người dùng tự thêm/gán động thiết bị (cảm biến, bơm, đèn) vào từng mảnh vườn trên UI hay danh sách thiết bị cố định?
4. **Nền tảng hiển thị (Target Viewport):** Thiết kế cho **Web App** hay **Mobile App**?

---

## BƯỚC 2: HOÀN THIỆN TÀI LIỆU USE CASE (`docs/USE_CASES.md` & `report/`)
**Quality Gate bắt buộc:** Phải phủ kín 100% **9 nhóm chức năng** trong `docs/ProjectTitle&FunctionalRequirement.pdf`:

| Gate # | Yêu cầu gốc từ `ProjectTitle&FunctionalRequirement.pdf` | Kiểm tra độ phủ Use Case |
| :---: | :--- | :--- |
| **G1** | Hiển thị dữ liệu tổng hợp toàn hệ thống | Dashboard tổng quan toàn nông trại |
| **G2** | Quản lý theo từng khu đất / mảnh vườn (có loại cây trồng khác nhau) | CRUD khu đất/mảnh vườn + loại cây trồng |
| **G3** | Quản lý chi tiết từng thiết bị: điều khiển (nếu là actuator), xem biểu đồ lịch sử (nếu là sensor) | Xem chi tiết sensor chart + bật/tắt thiết bị |
| **G4** | Quản lý lịch trình điều khiển thiết bị theo ngày / thời gian trong ngày tự động (theo cấp mảnh vườn/loại cây) | CRUD lịch trình tự động theo mảnh vườn/cây trồng |
| **G5** | Quản lý thiết lập ngưỡng và **các hành động đi kèm nếu có** | Đặt ngưỡng min/max + cấu hình hành động tự động đi kèm (VD: tự bật bơm/quạt) |
| **G6** | Cảnh báo vượt ngưỡng | Phát hiện, thông báo và xử lý cảnh báo vượt ngưỡng |
| **G7** | Quản lý nhật ký hành động của ứng dụng (không dùng log tự động của IoT server) | Tra cứu & ghi nhận Audit Log độc lập của ứng dụng |
| **G8** | Quản lý user và phân quyền: có tác nhân người dùng và quản trị riêng biệt | Quản lý tài khoản + phân quyền Admin / Người dùng |
| **G9** | **Chuyên biệt HTTT:** Báo cáo trực quan, đa chiều, báo cáo động, **tuỳ chỉnh hiển thị báo cáo**, tải/xuất dữ liệu báo cáo | Lọc báo cáo động đa chiều + tuỳ chọn cột/biểu đồ hiển thị + xuất file |

---

## BƯỚC 3: DỰNG WIREFRAME MOCKUP (`frontend/mockups/`)
Chỉ bắt đầu vẽ sau khi Bước 2 vượt qua đủ 9 Gate (`G1` → `G9`). Mỗi màn hình `SCR-xx` bám sát Use Case đã chốt:
1. Cụm Giám sát toàn hệ thống & Chi tiết Khu đất / Thiết bị (`G1, G2, G3`).
2. Cụm Lịch trình tự động, Ngưỡng + Hành động đi kèm & Cảnh báo (`G4, G5, G6`).
3. Cụm Báo cáo HTTT (đa chiều, động, tuỳ chỉnh hiển thị, xuất file) & Nhật ký ứng dụng (`G9, G7`).
4. Cụm Quản lý User & Phân quyền (`G8`).

---

## BƯỚC 4: CHỐT CONTRACT & KIẾN TRÚC (SAU KHI XONG WIREFRAME)
1. Chốt `contracts/api.md` từ các màn hình đã vẽ.
2. Chốt Tech Stack & CSDL vào `docs/decisions/`.
