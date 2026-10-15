# BỘ GHI NHỚ DỰ ÁN (PROJECT KNOWLEDGE BASE)
**Đồ án môn học Đa ngành (CO3111) - Hướng Hệ Thống Thông Tin (HTTT)**
*Trường Đại học Bách Khoa - ĐHQG TP.HCM*

---

## 1. THÔNG TIN & QUYẾT ĐỊNH CỐT LÕI (CORE DECISIONS)

* **Tên đề tài:** **Smart Farm (Xây dựng ứng dụng quản lý thiết bị cho nông trại thông minh)**.
  * **Tên tiếng Anh:** Smart Farm Device Management System.
  * **Giảng viên hướng dẫn:** TS. Trần Thị Quế Nguyệt.
  * **Thông tin nhóm:** Nhóm 4.
    * Lý Trung Hòa -- 2311097
    * Nguyễn Miên Phú -- 2312658
    * Trương Thái Nguyên -- 2312391
    * Ngô Phương Quang -- 2352967
  * **Phân cấp quản lý:** Nông trại gồm nhiều khu đất / mảnh vườn (Zone / Plot). Mỗi khu trồng loại cây khác nhau, có nhu cầu môi trường, lịch trình tưới tiêu/chiếu sáng và ngưỡng cảnh báo riêng biệt.
* **Chuyên ngành chính:** **Hệ thống thông tin (HTTT)**.
  * **Trọng tâm bắt buộc của hướng HTTT:** 
    * Báo cáo trực quan, đa chiều (Multi-dimensional reporting: theo thời gian, theo khu vực/mảnh vườn, theo trạng thái thiết bị, theo sự kiện cảnh báo).
    * Báo cáo động (Dynamic reporting) với bộ lọc linh hoạt.
    * Tùy biến hiển thị báo cáo và hỗ trợ xuất/tải dữ liệu (Export Excel/CSV, PDF summary).
    * Thiết kế CSDL chuẩn hóa (ERD), quản lý phân quyền (Admin vs User/Operator), và nhật ký hoạt động (Audit/Activity Log riêng của ứng dụng).
* **Giai đoạn hiện tại của nhóm:** **Tuần 42**.
* **Định dạng báo cáo chính thức:** **LaTeX** (đã khởi tạo trong thư mục `report/` theo mẫu chuẩn Khoa CSE - ĐH Bách Khoa).
* **Hiện trạng phần Use Case (Bạn A đã hoàn thành trong `report/section/UseCase.tex`):**
  * 11 Yêu cầu chức năng: `FR-01` $\rightarrow$ `FR-11`.
  * 4 Yêu cầu phi chức năng: `NFR-01` $\rightarrow$ `NFR-04`.
  * 2 Tác nhân: Quản trị viên (Admin) và Người vận hành (Operator).
  * 12 Use Case: Phân hệ Quản trị (UC-01 $\rightarrow$ UC-05), Phân hệ Giám sát & Điều khiển (UC-06 $\rightarrow$ UC-08), Phân hệ Tự động hóa & Cảnh báo (UC-09 $\rightarrow$ UC-11), Phân hệ Báo cáo & Phân tích HTTT (UC-12).
  * Sơ đồ `report/images/usecase_diagram.png` và Ma trận phân nhiệm (Traceability Matrix).
  * 6 bảng đặc tả chi tiết: UC-05 (Audit Log), UC-08 (Điều khiển thủ công), UC-09 (Lập lịch), UC-10 (Thiết lập ngưỡng), UC-11 (Xử lý cảnh báo), UC-12 (Báo cáo đa chiều & xuất file).


---

## 2. TRẠNG THÁI CÁC HẠNG MỤC (STATUS TRACKER)

| Hạng mục | Trạng thái | Ghi chú / Phương án đề xuất |
| :--- | :--- | :--- |
| **Đề tài** | **ĐÃ CHỐT** | Smart Farm (Nông trại thông minh). |
| **Thiết bị Input** | *Chưa chốt* | Đề xuất tối ưu (bám sát tài liệu môn học): <br>1. Cảm biến độ ẩm đất (Soil moisture)<br>2. Cảm biến nhiệt độ & độ ẩm không khí (DHT11/DHT20)<br>*(Dự phòng: Cảm biến ánh sáng LDR)* |
| **Thiết bị Output** | *Chưa chốt* | Đề xuất tối ưu: <br>1. Relay điều khiển máy bơm nước (Pump)<br>2. Relay quạt thông gió hoặc Đèn quang hợp (Fan/LED)<br>*(Dự phòng: Còi buzzer cảnh báo vượt ngưỡng)* |
| **Nền tảng ứng dụng** | *Chưa chốt* | Web App (React / Next.js) hoặc Mobile App (Flutter / React Native). |
| **Backend & CSDL** | *Chưa chốt* | Python (FastAPI) hoặc Node.js (Express) + PostgreSQL/MySQL (rất mạnh cho báo cáo HTTT). |
| **IoT Gateway** | *Theo chuẩn môn học* | Python Script (`pyserial` giao tiếp UART với Yolo:bit / Microbit, `paho-mqtt` giao tiếp Adafruit IO). |

---

## 3. MONG MUỐN CỦA BẠN (USER INTENT & PRINCIPLES)

1. **Phương châm triển khai:** **Làm nhanh, vừa đủ (Lean & Pragmatic) nhưng KHÔNG sơ sài**.
   * Đạt điểm tối đa vào các tiêu chí đánh giá cốt lõi của môn học và barem chấm điểm của bộ môn.
   * Tập trung làm sâu vào tính năng chuyên ngành HTTT (Báo cáo, CSDL, Phân quyền, Log), không sa đà vào các tính năng rườm rà vượt ngoài phạm vi đánh giá môn học.
   * Kiến trúc rõ ràng, tài liệu hóa chuẩn chỉ, sẵn sàng cho các buổi gặp GV hướng dẫn (Meeting 2, 3, 4) và video demo.

---

## 4. QUY TẮC & LUẬT TRÌNH BÀY (CONVENTIONS & RULES)

1. **Ngôn ngữ & Phong cách:**
   * Trình bày tiếng Việt mạch lạc, chuyên nghiệp, đúng thuật ngữ chuyên ngành CNTT/HTTT.
   * Sử dụng định dạng Markdown rõ ràng, phân mục logic, có bảng biểu, checklist để dễ tra cứu.
2. **Tuân thủ Barem Đồ án Đa ngành:**
   * Đáp ứng đủ **5 Modules bắt buộc**:
     * *Module 1:* Nhận dữ liệu cảm biến đầu vào.
     * *Module 2:* Kiểm tra ngưỡng & phát hiện bất thường.
     * *Module 3:* Điều khiển thiết bị đầu ra (tự động theo ngưỡng/lịch trình hoặc thủ công).
     * *Module 4:* Ghi nhận nhật ký hành động (Activity Log độc lập, lưu DB).
     * *Module 5:* Data Dashboard trực quan hóa trạng thái và lịch sử.
   * Đặc tả Use-case phải theo chuẩn (Tên, Actor, Pre-condition, Main Flow, Alternative Flow, Post-condition).
   * Yêu cầu phi chức năng phải **đo lường được** (thời gian phản hồi, tải, độ trễ MQTT).
3. **Tính kế thừa & Bền vững:**
   * Mọi quyết định mới hoặc thay đổi tiếp theo sẽ được cập nhật liên tục vào file này (`PROJECT_KNOWLEDGE.md`) để làm bộ nhớ xuyên suốt buổi làm việc.
4. **Quy chuẩn Cấu trúc Báo cáo (Tuân thủ nghiêm ngặt phong cách `sample_report`):**
   * **Bố cục 3 chương nòng cốt:**
     1. **Giới thiệu (Introduction):** Bối cảnh, mục tiêu 5 module, phạm vi đa khu đất/đa cây trồng.
     2. **Thiết bị (Devices):** Thiết bị đầu vào (2.1), Thiết bị đầu ra (2.2), Mạch điều khiển \& IoT Gateway (2.3).
     3. **Requirement:** Yêu cầu người dùng (3.1), Yêu cầu chức năng FR (3.2), Yêu cầu phi chức năng NFR (3.3), Tác nhân \& Danh mục Use Case (3.4), Sơ đồ \& Ma trận phân nhiệm (3.5), Đặc tả Use Case chi tiết (3.6).
   * **Quy tắc phân cấp số thập phân:** Mọi nội dung liên quan bên dưới bắt buộc phân cấp đánh số chuẩn `x.1`, `x.2`, `x.y.z`.
   * **Hai góc nhìn phân tích:** Luôn phân tích theo 2 khía cạnh song song: *Khía cạnh IoT & Môi trường thực địa* và *Khía cạnh Ứng dụng & Hệ thống thông tin*.
5. **Quy tắc nhất quán ngôn ngữ tiêu đề & thuật ngữ (Language Consistency Rule):**
   * **Tuyệt đối KHÔNG dùng kiểu mở ngoặc song ngữ** như `Tiếng Việt (Tiếng Anh)` trong các tiêu đề (ví dụ: cấm `Giới thiệu đề tài (Introduction)`, `Thiết bị (Devices)`...).
   * **Nguyên tắc chọn lựa:** Một là Tiếng Việt, hai là Tiếng Anh.
     * Nếu dịch sang tiếng Việt tự nhiên, chuẩn mực: **Dùng thuần Tiếng Việt** (ví dụ: *Giới thiệu*, *Thiết bị*, *Yêu cầu hệ thống*, *Yêu cầu người dùng*, *Yêu cầu chức năng*...).
     * Nếu dịch sang tiếng Việt gượng gạo, lạ lẫm hoặc không sát chuyên ngành: **Dùng thuần Tiếng Anh** (ví dụ: *Dashboard*, *IoT Gateway*, *Audit Log*, *Use Case*, *Traceability Matrix*...).
6. **Quy tắc bắt buộc Git Commit sau khi hoàn thành task (Mandatory Commit Rule):**
   * Sau khi hoàn tất bất kỳ task chỉnh sửa, cập nhật hoặc tái cấu trúc mã nguồn/tài liệu nào, Agent **BẮT BUỘC PHẢI THỰC HIỆN COMMIT LẠI VÀO GIT** (`git add . && git commit -m "..."`).
   * Mục đích: Lưu giữ checkpoint an toàn, bảo vệ tài liệu không bị ghi đè hay mất mát khi có các thao tác ngoài ý muốn (như `git pull` hoặc `sync_overleaf.py pull`).

---

## 5. YÊU CẦU CỦA GIẢNG VIÊN HƯỚNG DẪN & PHÂN CÔNG NHÓM (TEAM ASSIGNMENT)

### 5.1. Nội dung báo cáo GVHD yêu cầu (File Doc báo cáo)
1. **User requirement** (Yêu cầu người dùng tổng quan cho Smart Farm).
2. **Làm quen với server và tạo dashboard trên server Adafruit** (Cấu hình feed, blocks, giao thức MQTT).
3. **System requirement** (Yêu cầu chi tiết hệ thống, use-case & đặc tả use-case).
4. **Hiện thực và tích hợp IoT Gateway bằng Python** (Code giao tiếp Serial UART và MQTT Adafruit IO).

### 5.2. Phân công nhiệm vụ nhóm 4 người
* **Bạn (Leader/User):** Phụ trách toàn bộ phần **Requirement** bao gồm:
  * **User Requirements:** Nhu cầu thực tế của người quản lý nông trại, bài toán nghiệp vụ, phân cấp khu vực canh tác.
  * **System Requirements (Chức năng & Phi chức năng):** Bóc tách chi tiết 5 modules (Input, Threshold, Output, Activity Log, Dashboard) và các yêu cầu đo lường được (hiệu năng, độ trễ MQTT, bảo mật).
  * *Vai trò:* Làm "kim chỉ nam" cho 3 thành viên còn lại triển khai đúng hướng.
* **Bạn A:** Phụ trách phần **Use Case**:
  * Vẽ sơ đồ Use Case Diagram (phân rõ Admin vs User/Farmer).
  * Viết đặc tả Use Case chi tiết (chuẩn form: Pre-condition, Main Flow, Alternative Flow, Post-condition) khớp 100% với System Requirement của bạn.
* **Hai bạn B & C:** Phụ trách phần **IoT Server & Gateway**:
  * Tạo tài khoản, cấu hình Feed & Dashboard trên Adafruit IO.
  * Hiện thực và kiểm thử code IoT Gateway bằng Python (kết nối UART Serial đọc cảm biến từ mạch vi điều khiển và gửi/nhận dữ liệu qua MQTT Adafruit IO).

---

## 6. KẾ HOẠCH HÀNH ĐỘNG & TIẾN ĐỘ THỰC HIỆN
- [x] **Mục 1 (Giới thiệu & Thiết bị):** Đã hoàn thành [`report/section/Introduction.tex`](file:///d:/DADN/report/section/Introduction.tex) (Bối cảnh nông trại, mục tiêu 5 module, phạm vi đa khu đất/đa cây trồng, danh mục thiết bị cảm biến và cơ cấu chấp hành).
- [x] **Mục 2 (User Requirements):** Đã hoàn thành [`report/section/UserRequirement.tex`](file:///d:/DADN/report/section/UserRequirement.tex) (Đối tượng người dùng, nỗi đau nghiệp vụ, 8 Yêu cầu người dùng `UR-01` $\rightarrow$ `UR-08` phân theo IoT và HTTT, Bảng ánh xạ vết sang `FR` và `UC`).
- [x] **Mục 3 (System Requirements & Use Case):** Đã có [`report/section/UseCase.tex`](file:///d:/DADN/report/section/UseCase.tex) do Bạn A viết (FR-01 $\rightarrow$ FR-11, NFR-01 $\rightarrow$ NFR-04, 12 Use Case, sơ đồ và 6 đặc tả chi tiết).
- [x] **Biên dịch thử nghiệm:** Đã tích hợp vào [`report/main.tex`](file:///d:/DADN/report/main.tex) và biên dịch ra file PDF hoàn chỉnh [`report/main.pdf`](file:///d:/DADN/report/main.pdf) (25 trang) chuẩn mẫu Khoa CSE - ĐH Bách Khoa với 0 lỗi.
- [ ] **Mục 4 (Server & Dashboard Adafruit IO):** Chờ 2 bạn B & C thực hiện cấu hình Feed & Dashboard.
- [ ] **Mục 5 (IoT Gateway Python):** Chờ 2 bạn B & C hoàn thiện code giao tiếp UART Serial và MQTT Adafruit IO.

