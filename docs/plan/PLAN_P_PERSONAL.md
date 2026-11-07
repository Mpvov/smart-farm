# KẾ HOẠCH CÁ NHÂN CỦA P (TỪ BÀI TOÁN → WIREFRAME → KIẾN TRÚC)

**Phạm vi của P:** Bài toán nghiệp vụ, Tài liệu (`docs/`), Wireframe UI (`frontend/mockups/`), và định hình `contracts/api.md` + `backend/` sau khi chốt UI.  
**Không nằm trong plan này:** Phần IoT Gateway & Adafruit IO của N và Q (`gateway/`).

---

## BƯỚC 1: CHỐT 4 CÂU HỎI BÀI TOÁN TÁC ĐỘNG TRỰC TIẾP LÊN UI
*(Phải trả lời xong trước khi vẽ bất kỳ màn hình nào)*

1. **Quy mô chủ thể (Tenancy):** Hệ thống phục vụ **1 nông trại duy nhất** (1 chủ, chia nhiều khu đất/Zone) hay **nhiều nông trại độc lập** (SaaS nhiều chủ)?
   * *Tác động UI:* Có hay không màn hình chọn Nông trại / Quản lý danh sách Nông trại.
2. **Phân cấp thực thể (Hierarchy):** Một khu đất (Zone/Plot) gắn cứng với 1 bộ cảm biến + thiết bị, hay người dùng tự gán động từng cảm biến vào khu đất trên UI?
   * *Tác động UI:* Độ phức tạp của màn Quản lý khu vực & thiết bị (`UC-04`).
3. **Nền tảng hiển thị (Target Viewport):** Thiết kế Wireframe cho **Web Desktop** (ưu tiên bảng biểu, báo cáo HTTT rộng) hay **Mobile App**?
   * *Tác động UI:* Bố cục điều hướng (Sidebar vs Bottom Bar) và cách trình bày bảng báo cáo.
4. **Phân quyền hiển thị (Admin vs Operator):** Operator chỉ bị ẩn các màn Quản trị (`UC-02, 03, 04, 05, 09, 10`) hay dùng giao diện hoàn toàn khác Admin?

---

## BƯỚC 2: ĐẶC TẢ KHUNG MÀN HÌNH (`docs/USE_CASES.md`)
Từ 12 Use Case đã có trong báo cáo (`UC-01` → `UC-12`), chốt danh sách màn hình `SCR-xx` với 3 thông tin ngắn gọn cho mỗi màn:
* **Ai dùng** (Admin / Operator).
* **Hiển thị thông tin gì** (các khối dữ liệu trên màn hình).
* **Bấm nút gì được** (các thao tác chính).

---

## BƯỚC 3: DỰNG WIREFRAME MOCKUP (`frontend/mockups/`)
Thực hiện tuần tự theo 4 cụm màn hình:
1. **Cụm Giám sát & Điều khiển (`UC-06, 07, 08`):** Màn Dashboard theo khu đất, xem cảm biến và bật/tắt thiết bị thủ công.
2. **Cụm Tự động hóa & Cảnh báo (`UC-09, 10, 11`):** Màn đặt ngưỡng min/max, lập lịch tưới/đèn, và xử lý cảnh báo.
3. **Cụm Trọng tâm HTTT (`UC-12, UC-05`):** Màn Báo cáo động đa chiều (bộ lọc linh hoạt + nút xuất Excel/CSV/PDF) và màn tra cứu Audit Log.
4. **Cụm Quản trị & Đăng nhập (`UC-01, 02, 03, 04`):** Màn Login, quản lý User/Role và quản lý Khu đất.

---

## BƯỚC 4: CHỐT CONTRACT & TECH STACK (SAU KHI XONG WIREFRAME)
Khi các màn hình Wireframe đã rõ từng ô dữ liệu:
1. Viết `contracts/api.md` dựa đúng trên dữ liệu các màn hình cần gọi.
2. Chốt quyết định chọn Tech Stack & CSDL vào `docs/decisions/` để chuẩn bị cho giai đoạn code.
