# Smart Farm Device Management System

**Môn học:** Thực tập Đồ án môn học Đa ngành (CO3111) - Trường ĐH Bách Khoa ĐHQG TP.HCM  
**Chuyên ngành:** Hệ Thống Thông Tin (HTTT)  
**Nhóm:** 4

---

## 1. Phân công nhiệm vụ (Team Assignment)

| Thành viên | MSSV | Vai trò chính trong dự án |
| :--- | :---: | :--- |
| **Lý Trung Hòa** | 2311097 | Phụ trách System Requirement & Use Case (Bạn A) |
| **Nguyễn Miên Phú** | 2312658 | Nhóm trưởng: Architecture, User Requirement, Frontend & Backend |
| **Trương Thái Nguyên** | 2312391 | IoT Server (Adafruit IO) & Gateway Python (Bạn B) |
| **Ngô Phương Quang** | 2352967 | IoT Gateway Python & Kiểm thử thiết bị (Bạn C) |

---

## 2. Cấu trúc Repository

```text
DADN/
├── AGENTS.md                 # Luật cho AI Agent (nguồn chuẩn duy nhất)
├── CLAUDE.md                 # @AGENTS.md
├── scripts/check.ps1         # Script kiểm tra hợp lệ toàn repo (exit 0)
├── contracts/                # Format UART, MQTT và samples test
├── docs/                     # Kiến trúc, Use Cases, Tri thức, Tiến độ
├── report/                   # Báo cáo LaTeX chính thức (Khoa CSE)
├── frontend/                 # UI Mockups & Giao diện người dùng
├── backend/                  # CSDL PostgreSQL & API Service
└── gateway/                  # Code Python kết nối UART Serial ↔ Adafruit IO
```

---

## 3. Lệnh kiểm tra nhanh (Validation Command)

Trước khi commit hoặc báo xong việc, chạy:

```powershell
./scripts/check.ps1
```

Script sẽ kiểm tra:
1. Không có file secret `.env` bị commit hoặc chứa key thật.
2. Toàn bộ mẫu dữ liệu trong `contracts/samples/` hợp lệ với parser.
3. Các file cấu trúc bắt buộc của dự án đầy đủ.
