# TRI THỨC NỀN TẢNG DỰ ÁN (PROJECT KNOWLEDGE)

**Đồ án môn học Đa ngành (CO3111) - Hướng Hệ Thống Thông Tin (HTTT)**

---

## 1. THÔNG TIN CỐT LÕI & PHẠM VI ĐÃ CHỐT

* **Tên đề tài:** Smart Farm Device Management System (Ứng dụng quản lý thiết bị cho nông trại thông minh).
* **Nhóm 4:** H (Use Case), P (UR, UI, Backend), N & Q (IoT Server & Gateway).
* **Bước hiện tại:** Đã xong **UR → UC** (8 UR, 11 FR, 6 NFR, 12 UC) và bối cảnh bài toán nông trại đa khu đất/mảnh vườn (Zone / Plot).
* **Các quyết định CHƯA CHỐT (cần hỏi trước khi làm):**
  * Sản phẩm phục vụ **1 chủ nông trại** (nhiều khu vườn) hay **nhiều chủ nông trại** (multi-tenant)?
  * Tech stack Frontend (Web hay Mobile), Backend framework, Hệ quản trị CSDL.
  * Chi tiết thiết bị Input/Output thực tế.

---

## 2. TRỌNG TÂM CHUYÊN NGÀNH HỆ THỐNG THÔNG TIN (HTTT)

Barem chấm điểm chuyên ngành HTTT yêu cầu:
1. **5 Modules bắt buộc của đề cương:**
   * Module 1: Nhận dữ liệu cảm biến đầu vào.
   * Module 2: Kiểm tra ngưỡng & phát hiện bất thường.
   * Module 3: Điều khiển thiết bị đầu ra (tự động & thủ công).
   * Module 4: Ghi nhận nhật ký hành động (Audit/Activity Log độc lập trong CSDL).
   * Module 5: Data Dashboard trực quan hóa trạng thái và lịch sử.
2. **Đặc trưng hướng HTTT:**
   * Báo cáo trực quan đa chiều (theo thời gian, khu vực, trạng thái thiết bị, sự kiện cảnh báo).
   * Báo cáo động với bộ lọc linh hoạt và xuất file (Excel/CSV/PDF).
   * Thiết kế CSDL chuẩn hóa (ERD) và phân quyền (Admin vs Operator).
