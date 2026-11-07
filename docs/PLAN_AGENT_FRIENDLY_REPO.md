# KẾ HOẠCH XÂY DỰNG AGENT-FRIENDLY REPOSITORY

**Dự án:** Smart Farm Device Management System (CO3111 - Hướng HTTT)  
**Mục tiêu:** Thiết lập cấu trúc repo chuẩn hóa giúp AI Agent (Antigravity) và các thành viên nhóm làm việc chính xác, không over-engineering, không đi lạc phạm vi.

---

## 1. NGUYÊN TẮC THIẾT KẾ (DESIGN PRINCIPLES)

1. **Ranh giới rõ ràng (Explicit Boundaries):** Phân chia độc lập giữa UI, Backend và IoT Gateway; mỗi module có tài liệu phạm vi riêng.
2. **Ngữ cảnh tối thiểu (Context Efficiency):** Agent khi làm task ở thư mục nào chỉ cần nạp tài liệu thư mục đó, tiết kiệm token tối đa.
3. **YAGNI & Ponytail Ultra:** Chỉ tạo khung sườn và file chỉ dẫn cần thiết; không tạo code thừa, không cấu hình CI/CD phức tạp khi chưa đến giai đoạn.
4. **Kế thừa tri thức:** Mọi quyết định tiếp tục bám sát [`docs/PROJECT_KNOWLEDGE.md`](./PROJECT_KNOWLEDGE.md) và chuẩn 5 module môn học.

---

## 2. CẤU TRÚC THƯ MỤC DỰ KIẾN (TARGET DIRECTORY TREE)

```text
d:\DADN/
├── README.md                      # [MỚI] Tổng quan dự án, bản đồ repo, hướng dẫn chạy nhanh
├── .gitignore                     # [CẬP NHẬT] Thêm quy tắc chặn node_modules, .env*, build artifacts
├── AGENTS.md / GEMINI.md          # [HIỆN HỮU] Quy tắc hành vi bắt buộc (Ponytail, ADHD, Caveman)
├── docs/                          # [MỞ RỘNG] Bộ nhớ tri thức & tài liệu kiến trúc
│   ├── PROJECT_KNOWLEDGE.md       # Tri thức chung, tiến độ và phân công nhóm
│   ├── ARCHITECTURE.md            # [MỚI] Kiến trúc tổng thể 5 module, luồng dữ liệu & data contracts
│   └── Team_Task_Management.xlsx  # Bảng theo dõi tiến độ công việc
├── report/                        # [HIỆN HỮU] Báo cáo LaTeX chính thức (Khoa CSE)
├── frontend/                      # [MỚI] Phân hệ Giao diện & Mockup
│   ├── README.md                  # Hướng dẫn Agent phạm vi UI, quy chuẩn thiết kế
│   └── mockups/                   # Thư mục chứa hình ảnh wireframe / file prototype
├── backend/                       # [MỚI] Phân hệ Xử lý trung tâm & CSDL
│   └── README.md                  # Hướng dẫn Agent phạm vi CSDL, API contract, Audit Log
└── gateway/                       # [MỚI] Phân hệ IoT Gateway
    └── README.md                  # Hướng dẫn Agent/Bạn B & C: UART Serial, MQTT Adafruit IO
```

---

## 3. DANH MỤC HẠNG MỤC CẦN TẠO (DELIVERABLES INVENTORY)

| STT | File / Thư mục | Nội dung cốt lõi | Vai trò đối với Agent |
| :---: | :--- | :--- | :--- |
| 1 | `README.md` | Bối cảnh Smart Farm, bảng phân công 4 thành viên, bản đồ đường dẫn file. | Cung cấp cái nhìn toàn cảnh ngay khi Agent khởi tạo session. |
| 2 | `.gitignore` | Bổ sung: `node_modules/`, `dist/`, `.env*`, `venv/`, `*.sqlite`. | Ngăn Agent đọc/quét nhầm các file thư viện rác gây tràn context. |
| 3 | `docs/ARCHITECTURE.md` | Sơ đồ luồng dữ liệu 5 module (Sensors $\rightarrow$ Gateway $\rightarrow$ Server $\rightarrow$ DB/Dashboard), API payload mẫu. | Chuẩn hóa format dữ liệu giữa Frontend, Backend và Gateway. |
| 4 | `frontend/README.md` | Liệt kê 8 màn hình tương ứng 12 Use Case; chỉ định font, màu sắc, phong cách *Operate*. | Khóa chặt phạm vi, ngăn Agent tự ý vẽ thêm màn hình ngoài scope. |
| 5 | `backend/README.md` | Quy chuẩn CSDL (PostgreSQL/MySQL), cấu trúc bảng Audit Log, phân quyền Role. | Định hướng thiết kế CSDL HTTT đúng trọng tâm barem điểm. |
| 6 | `gateway/README.md` | Quy chuẩn format chuỗi Serial UART (`!1:TEMP:28#`), topic MQTT Adafruit IO. | Hướng dẫn bạn B & C hiện thực code không bị lệch format. |

---

## 4. LỘ TRÌNH TRIỂN KHAI THEO PHASE (ACTION ROADMAP)

* **Phase 1 (Hiện tại):** Khởi tạo bộ khung Agent-Friendly Repo trên (chỉ gồm cấu trúc thư mục, .gitignore và các file markdown định hướng).
* **Phase 2 (Trọng tâm tuần này):** Triển khai đặc tả chi tiết và dựng Wireframe Mockup cho 8 màn hình trong `frontend/mockups/`.
* **Phase 3:** Hỗ trợ bạn B & C hoàn thiện script IoT Gateway kết nối Adafruit IO trong `gateway/`.
* **Phase 4:** Thiết kế CSDL chuẩn hóa (ERD) và viết API Service trong `backend/` theo đúng mock data đã chốt.

---

## 5. TIÊU CHÍ ĐÁNH GIÁ THÀNH CÔNG (SUCCESS CRITERIA)
- [ ] Mọi thư mục con đều có file `README.md` chỉ rõ Input/Output và ranh giới trách nhiệm.
- [ ] Không có file thừa hoặc code rác (Ponytail Ultra).
- [ ] Đã commit Git đầy đủ sau khi tạo xong.
