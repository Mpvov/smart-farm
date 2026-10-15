# AGENT INSTRUCTIONS & WORKSPACE RULES
**Môn học:** Thực tập Đồ án môn học Đa ngành (CO3111) - Trường ĐH Bách Khoa ĐHQG TP.HCM  
**Chuyên ngành:** Hệ Thống Thông Tin (HTTT)  
**Đề tài:** Smart Farm (Nông trại thông minh)

---

## 🚨 QUY TẮC BẮT BUỘC TRƯỚC KHI THỰC HIỆN BẤT KỲ TASK NÀO (MANDATORY PREREQUISITE)

> [!IMPORTANT]
> **BẮT BUỘC ĐỌC TRƯỚC:** Mỗi khi bắt đầu một phiên làm việc hoặc nhận bất kỳ yêu cầu (prompt/task) mới nào từ người dùng, Agent **PHẢI ĐỌC TÀI LIỆU SAU ĐÂY ĐẦU TIÊN**:
> 
> 👉 **[docs/PROJECT_KNOWLEDGE.md](file:///d:/DADN/docs/PROJECT_KNOWLEDGE.md)**
>
> Tuyệt đối không thực hiện bất kỳ thao tác tạo file, code, viết báo cáo hay tư vấn nào khi chưa đọc và nắm vững các quyết định đã ghi nhận trong file trên!

---

## 📌 NGUYÊN TẮC LÀM VIỆC CỦA NGƯỜI DÙNG (USER PRINCIPLES)

1. **Phương châm cốt lõi:** **"Làm nhanh, vừa đủ (Lean & Pragmatic) nhưng KHÔNG sơ sài"**.
   * Tập trung trực diện vào các tiêu chí đánh giá và barem chấm điểm của môn học.
   * Không rườm rà, không lan man các tính năng ngoài lề gây tốn thời gian.
   * Chất lượng đầu ra (tài liệu, use-case, thiết kế ERD, mã nguồn) phải chuẩn mực, khoa học, logic chặt chẽ.
2. **Quy chuẩn chuyên ngành Hệ Thống Thông Tin (HTTT):**
   * Đào sâu vào nghiệp vụ dữ liệu: Báo cáo trực quan đa chiều, báo cáo động, tùy chỉnh bộ lọc, xuất dữ liệu (Excel/CSV/PDF).
   * Phân quyền rõ ràng (Admin vs User).
   * Nhật ký hoạt động ứng dụng (Activity/Audit Log riêng trong CSDL, không dùng log mặc định của IoT Server).
3. **Quy chuẩn 5 Module theo Đề cương (Syllabus):**
   * *Module 1:* Nhận dữ liệu cảm biến đầu vào (tối thiểu 2 input).
   * *Module 2:* Kiểm tra ngưỡng & phát hiện bất thường.
   * *Module 3:* Điều khiển thiết bị đầu ra (tối thiểu 2 output: tự động & thủ công).
   * *Module 4:* Ghi nhận nhật ký hoạt động (Audit log).
   * *Module 5:* Data Dashboard trực quan hóa trạng thái hệ thống.
4. **Quy chuẩn Cấu trúc Báo cáo (Tuân thủ nghiêm ngặt phong cách `sample_report`):**
   * Bố cục phân chương nòng cốt:
     1. **Giới thiệu (Introduction):** Bối cảnh, mục tiêu 5 module, phạm vi phân cấp (nhiều khu đất, đa loại cây trồng).
     2. **Thiết bị (Devices):** Thiết bị đầu vào (Input), thiết bị đầu ra (Output), mạch điều khiển & IoT Gateway.
     3. **Requirement:** Gồm Yêu cầu người dùng (User Requirements), Yêu cầu chức năng (FR), Yêu cầu phi chức năng (NFR), Tác nhân, Use Case & Sơ đồ ma trận, Đặc tả chi tiết Use Case.
   * **Quy tắc phân cấp số thập phân:** Mọi nội dung bên trong bắt buộc phân mục logic dạng `x.1`, `x.2`, `x.y.z` (không gộp lung tung).
   * **Hai góc nhìn phân tích song song:** Bắt buộc phân tích theo 2 khía cạnh: *Khía cạnh IoT & Môi trường thực địa (Internet-of-Things aspect)* và *Khía cạnh Ứng dụng & Hệ thống thông tin (Application & HTTT aspect)*.
5. **Quy tắc nhất quán ngôn ngữ tiêu đề & thuật ngữ (Language Consistency Rule):**
   * **Tuyệt đối KHÔNG dùng kiểu mở ngoặc song ngữ** như `Tiếng Việt (Tiếng Anh)` trong các tiêu đề và đề mục (ví dụ: cấm `Giới thiệu đề tài (Introduction)`, `Thiết bị (Devices)`...).
   * **Nguyên tắc chọn lựa:** Một là Tiếng Việt, hai là Tiếng Anh.
     * Nếu dịch sang tiếng Việt tự nhiên, rõ nghĩa và chuẩn mực: **Dùng thuần Tiếng Việt** (ví dụ: *Giới thiệu*, *Thiết bị*, *Yêu cầu hệ thống*, *Yêu cầu người dùng*, *Yêu cầu chức năng*, *Yêu cầu phi chức năng*...).
     * Nếu dịch sang tiếng Việt gượng gạo, lạ lẫm hoặc không sát chuyên ngành: **Dùng thuần Tiếng Anh** (ví dụ: *Dashboard*, *IoT Gateway*, *Audit Log*, *Use Case*, *Traceability Matrix*...).
6. **Quy tắc bắt buộc Git Commit sau khi hoàn thành task (Mandatory Commit Rule):**
   * Sau khi hoàn tất bất kỳ thay đổi, cập nhật hoặc tái cấu trúc mã nguồn/tài liệu nào, Agent **BẮT BUỘC PHẢI THỰC HIỆN COMMIT LẠI VÀO GIT** (`git add . && git commit -m "..."`).
   * Mục đích: Lưu giữ checkpoint an toàn, bảo vệ tài liệu không bị ghi đè hay mất mát khi có các thao tác ngoài ý muốn (như `git pull` hoặc `sync_overleaf.py pull`).

---

## 📂 QUY HOẠCH CẤU TRÚC THƯ MỤC DỰ ÁN

* `docs/`: Chứa toàn bộ tài liệu đặc tả, yêu cầu môn học, tài liệu kỹ thuật phần cứng, và file `PROJECT_KNOWLEDGE.md`.
* `report/`: Chứa các báo cáo nộp định kỳ (Báo cáo giữa kỳ, Báo cáo cuối kỳ theo mẫu Khoa CSE).
* Mọi quyết định kỹ thuật mới (thiết bị, tech stack, API contract, schema...) sau khi được người dùng duyệt đều phải được cập nhật lại vào `docs/PROJECT_KNOWLEDGE.md`.

---

## 📝 QUY CÁCH TRÌNH BÀY (CONVENTIONS)
* Trình bày tiếng Việt mạch lạc, đúng thuật ngữ chuyên ngành CNTT / HTTT.
* Tài liệu viết dạng Markdown rõ ràng, có phân mục, bảng biểu, checklist, sơ đồ luồng dữ liệu (Mermaid).
* Đường dẫn file tham chiếu phải dùng format clickable link chuẩn: `[tên_file](file:///đường_dẫn_tuyệt_đối)`.
