# KIẾN TRÚC & BÀI TOÁN HỆ THỐNG (SYSTEM CONTEXT)

> **Trạng thái hiện tại:** Đã hoàn thành bước **UR → UC** và bối cảnh bài toán.  
> **Chưa chốt:** Mô hình phục vụ (1 chủ nông trại hay nhiều chủ nông trại/multi-tenant), Kiến trúc chi tiết, Tech Stack (Web/Mobile, Backend framework, CSDL).

---

## 1. BỐI CẢNH & 5 MODULE BẮT BUỘC THEO ĐỀ CƯƠNG (CO3111)

1. **Module 1:** Nhận dữ liệu cảm biến đầu vào.
2. **Module 2:** Kiểm tra ngưỡng & phát hiện bất thường.
3. **Module 3:** Điều khiển thiết bị đầu ra (tự động & thủ công).
4. **Module 4:** Ghi nhận nhật ký hoạt động (Audit Log độc lập).
5. **Module 5:** Data Dashboard trực quan hóa trạng thái và lịch sử, báo cáo động đa chiều HTTT.

---

## 2. CÁC QUYẾT ĐỊNH CẦN CHỐT TRƯỚC KHI THIẾT KẾ CHI TIẾT

- [ ] Phạm vi sản phẩm: Phục vụ **1 nông trại** (nhiều khu đất/Zone) hay **nhiều chủ nông trại** (Multi-farm / Multi-tenant)?
- [ ] Nền tảng giao diện: Web App hay Mobile App?
- [ ] Kiến trúc kết nối giữa Gateway, Adafruit IO, Backend và Frontend.
- [ ] Lựa chọn CSDL và Backend stack (ghi nhận vào `docs/decisions/` sau khi chốt).
