# Smart Farm Device Management System

**Môn học:** Thực tập Đồ án môn học Đa ngành (CO3111) - Trường ĐH Bách Khoa ĐHQG TP.HCM  
**Chuyên ngành:** Hệ Thống Thông Tin (HTTT)  
**Nhóm:** 4

---

## 1. Phân công nhiệm vụ (Team Assignment)

| Thành viên | Vai trò chính trong dự án |
| :---: | :--- |
| **H** | Phụ trách System Requirement & Use Case |
| **P** | Nhóm trưởng: User Requirement, Architecture, Frontend & Backend |
| **N** | IoT Server (Adafruit IO) & Gateway Python |
| **Q** | IoT Gateway Python & Kiểm thử thiết bị |

---

## 2. Cấu trúc Repository

```text
DADN/
├── AGENTS.md                 # Luật cho AI Agent (nguồn chuẩn duy nhất)
├── CLAUDE.md                 # @AGENTS.md
├── scripts/check.ps1         # Script kiểm tra hợp lệ toàn repo (exit 0)
├── contracts/                # Format UART, MQTT, API và samples test
├── docs/                     # Kiến trúc, Use Cases, Tri thức, Tiến độ
├── report/                   # Báo cáo LaTeX chính thức (Khoa CSE)
├── frontend/                 # UI Mockups & Giao diện người dùng
├── backend/                  # API, CSDL, Audit Log, phân quyền (chưa chốt stack)
└── gateway/                  # Code Python kết nối UART Serial ↔ Adafruit IO
```

---

## 3. Lệnh kiểm tra nhanh (Validation Command)

Trước khi commit hoặc báo xong việc, chạy:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check.ps1
```
