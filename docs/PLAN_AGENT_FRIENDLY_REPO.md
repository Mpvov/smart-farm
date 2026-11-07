# KẾ HOẠCH XÂY DỰNG AGENT-FRIENDLY REPOSITORY (BẢN CHUẨN HÓA)

**Dự án:** Smart Farm Device Management System (CO3111 – Hướng HTTT)  
**Mục tiêu:** Thiết lập repository mà cả AI Agent (Antigravity, Claude Code) và 4 thành viên nhóm đều làm việc đúng phạm vi, đúng format dữ liệu, không lệch pha, không over-engineering.

---

## 1. NGUYÊN TẮC CỐT LÕI

1. **Một nguồn hướng dẫn duy nhất cho Agent:** `AGENTS.md` đặt ở thư mục gốc và trong từng module con (`frontend/`, `backend/`, `gateway/`). File `CLAUDE.md` chỉ chứa 1 dòng tham chiếu `@AGENTS.md`. Loại bỏ hoàn toàn sự phân mảnh giữa các file hướng dẫn.
2. **Luật quan trọng phải kiểm được bằng lệnh:** Mọi luật cứng bắt buộc phải có lệnh kiểm tra tương ứng trong `scripts/check.ps1`. Luật chỉ ghi bằng chữ mà không có lệnh kiểm chứng thì coi như vô hiệu.
3. **Contract trước, code sau:** Chuẩn hóa format UART Serial, topic MQTT Adafruit IO và payload API trước khi viết code. Mọi format phải có file mẫu thật (`samples/`) và script kiểm thử tự động.
4. **Ngữ cảnh tối thiểu (Context Efficiency):** File `AGENTS.md` chỉ chứa bảng layout, lệnh và câu lệnh mệnh lệnh ngắn gọn. Tri thức dài, giải thích chi tiết nằm trong `docs/`, Agent chỉ đọc khi thật sự cần.
5. **Sở thích cá nhân ở ngoài repo:** Văn phong cá nhân (Ponytail, Caveman, ADHD...) đặt trong cấu hình global của từng người (`~/.gemini/config/AGENTS.md`), giữ repo của nhóm thuần khiết và chuẩn mực kỹ thuật.
6. **YAGNI triệt để:** Không cài CI/CD phức tạp, không setup framework cồng kềnh khi chưa có code thực sự cần đến.

---

## 2. CẤU TRÚC THƯ MỤC CHUẨN

```text
DADN/
├── AGENTS.md                 # Luật chung toàn repo: layout, lệnh check, luật cứng
├── CLAUDE.md                 # Tham chiếu duy nhất: @AGENTS.md
├── README.md                 # Tổng quan dự án, phân công nhóm, lệnh chạy nhanh
├── .gitignore                # Chặn: node_modules/, dist/, venv/, .env, *.sqlite, LaTeX build
├── .env.example              # Mẫu biến môi trường (AIO_KEY...), tuyệt đối không chứa key thật
├── scripts/
│   └── check.ps1             # Script kiểm tra tự động trước khi báo hoàn thành (exit 0)
├── contracts/
│   ├── uart.md               # Đặc tả gói tin Serial giữa Yolo:bit/Microbit và Gateway
│   ├── mqtt.md               # Danh sách feed/topic Adafruit IO và format payload
│   ├── samples/              # File mẫu dữ liệu thực tế (UART packet, MQTT payload, API response)
│   └── test_contracts.py     # Script kiểm tra tính hợp lệ của mọi mẫu trong samples/
├── docs/
│   ├── ARCHITECTURE.md       # Luồng dữ liệu 5 module: Sensors → Gateway → Server → DB/Dashboard
│   ├── USE_CASES.md          # 12 Use Case ánh xạ trực tiếp sang các màn hình SCR-xx
│   ├── KNOWLEDGE.md          # Tri thức ổn định: barem môn học, bối cảnh, thuật ngữ HTTT
│   ├── PROGRESS.md           # Nhật ký tiến độ dạng Markdown (thay thế hoàn toàn file .xlsx)
│   └── decisions/
│       └── 0001-database.md  # Quyết định chọn CSDL (PostgreSQL) + lý do kỹ thuật
├── report/                   # Báo cáo LaTeX chính thức — Agent không tự ý sửa khi chưa yêu cầu
├── frontend/
│   ├── AGENTS.md             # Phạm vi UI, danh sách màn hình SCR-xx, quy chuẩn thiết kế
│   ├── CLAUDE.md             # @AGENTS.md
│   └── mockups/              # Nơi chứa wireframe/mockup UI
├── backend/
│   ├── AGENTS.md             # Phạm vi CSDL, Audit Log, phân quyền Role, API theo contracts/
│   ├── CLAUDE.md             # @AGENTS.md
│   └── src/                  # Mã nguồn API & DB (khởi tạo ở Phase 4)
└── gateway/
    ├── AGENTS.md             # Phạm vi UART ↔ MQTT, cấm tự đổi format gói tin
    ├── CLAUDE.md             # @AGENTS.md
    └── src/                  # Mã nguồn Python Gateway (khởi tạo ở Phase 3)
```

---

## 3. DANH MỤC HẠNG MỤC CẦN TẠO

| Hạng mục / File | Vai trò cốt lõi với Agent |
| :--- | :--- |
| **`AGENTS.md` (Gốc)** | Agent tự nạp mỗi session: chứa bảng layout trách nhiệm, lệnh kiểm tra, luật cứng, nguyên tắc "không chắc thì hỏi". |
| **`<module>/AGENTS.md`** | Khóa chặt phạm vi khi Agent làm việc trong thư mục con: quy định rõ Input/Output và file được phép sửa. |
| **`contracts/`** | Đảm bảo 2 đầu Gateway và Backend không lệch pha: đặc tả gói tin UART, payload MQTT/API kèm mẫu thật + test parser. |
| **`scripts/check.ps1`** | Tiêu chuẩn nghiệm thu tự động: Agent bắt buộc chạy và thấy `exit 0` trước khi báo xong task. |
| **`.env.example`** | Ngăn chặn lộ secret (Adafruit IO Key, DB credentials), chỉ cung cấp template rỗng. |
| **`docs/USE_CASES.md`** | Ánh xạ 12 Use Case sang danh sách màn hình `SCR-xx`. Agent không được tự ý vẽ thêm màn ngoài danh sách. |
| **`docs/decisions/0001-database.md`** | Cố định quyết định công nghệ (chọn PostgreSQL vì thế mạnh báo cáo HTTT), Agent không tự ý đổi stack. |
| **`docs/PROGRESS.md`** | Thay thế file `.xlsx` nhị phân; cả Agent và 4 thành viên đều đọc/ghi lịch sử công việc qua Git. |

---

## 4. KHUNG `AGENTS.md` GỐC CHUẨN

```markdown
# Smart Farm — Luật cho Agent

## 1. Layout & Trách nhiệm
| Path | Trách nhiệm | Người phụ trách |
| :--- | :--- | :--- |
| `frontend/` | UI + Wireframe Mockup | Bạn (Leader) |
| `backend/` | API + CSDL + Audit Log | Bạn (Leader) |
| `gateway/` | UART Serial ↔ MQTT Adafruit IO | Bạn B & Bạn C |
| `contracts/` | Đặc tả format dữ liệu + Mẫu test | Cả nhóm thống nhất |
| `report/` | Báo cáo LaTeX chính thức | Không sửa khi chưa được yêu cầu |

## 2. Lệnh bắt buộc
- Kiểm tra trước khi báo xong: `./scripts/check.ps1` (bắt buộc trả về exit 0).

## 3. Luật cứng (Hard Rules)
1. Format UART / MQTT / API chỉ lấy từ `contracts/`. Muốn đổi format thì phải sửa đồng thời contract + samples + test.
2. Không commit file `.env` hay key thật. Mọi thiết lập chỉ ghi vào `.env.example`.
3. Chỉ làm màn hình và use case được liệt kê trong `docs/USE_CASES.md`.
4. Không đổi CSDL hay cài thêm thư viện lớn khi chưa có Architecture Decision Record trong `docs/decisions/`.
5. Thiếu thông tin thì hỏi, tuyệt đối không tự suy diễn.
```

---

## 5. LỘ TRÌNH TRIỂN KHAI THEO 4 PHASE

* **Phase 1 – Khung sườn + Contract (Làm ngay):**
  1. Tạo `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore`, `.env.example`.
  2. Tạo `contracts/uart.md`, `contracts/mqtt.md`, thư mục `contracts/samples/` kèm `test_contracts.py`.
  3. Tạo `docs/ARCHITECTURE.md`, `docs/USE_CASES.md`, `docs/KNOWLEDGE.md`, `docs/PROGRESS.md`, `docs/decisions/0001-database.md`.
  4. Tạo `scripts/check.ps1` và xác nhận chạy đạt `exit 0`.
* **Phase 2 – Mockup (Trọng tâm hiện tại):**
  * Dựng wireframe mockup cho từng màn hình `SCR-xx` trong `frontend/mockups/`, dữ liệu mẫu lấy chuẩn từ `contracts/samples/`.
* **Phase 3 – Gateway (Bạn B & C):**
  * Viết script Python UART ↔ Adafruit IO trong `gateway/`. Test contract phải pass 100%. Tích hợp test parser vào `scripts/check.ps1`.
* **Phase 4 – Backend (Triển khai sau khi chốt UI):**
  * Thiết kế ERD, API schema theo payload trong `contracts/`, xây dựng bảng Audit Log và phân quyền RBAC.

---

## 6. TIÊU CHÍ NGHIỆM THU ĐO LƯỜNG ĐƯỢC (TESTABLE CRITERIA)

- [ ] Mở session mới ở Antigravity và Claude Code, hỏi *"format UART là gì, sửa ở đâu"*: Cả hai đều trỏ đúng `contracts/uart.md` mà không cần gợi ý thêm.
- [ ] Lệnh `./scripts/check.ps1` trả về `exit 0` sạch sẽ trên máy tính cá nhân.
- [ ] Cố tình sửa sai 1 mẫu JSON/chuỗi trong `contracts/samples/` $\rightarrow$ `./scripts/check.ps1` lập tức báo lỗi đỏ (exit khác 0).
- [ ] `git log -p` kiểm tra không sót bất kỳ API Key thật nào; `.env` nằm trong `.gitignore`.
- [ ] Tiến độ được theo dõi trực quan bằng Markdown qua `docs/PROGRESS.md`.
- [ ] Thực hiện Git commit an toàn toàn bộ Phase 1.
