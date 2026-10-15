"""
Script đồng bộ báo cáo Overleaf với Local (dành cho tài khoản Overleaf Free).
Hỗ trợ:
  1. python sync_overleaf.py config --project <ID> --cookie <SESSION_COOKIE>
  2. python sync_overleaf.py pull   (Kéo dữ liệu mới nhất từ Overleaf về máy)
  3. python sync_overleaf.py push   (Đẩy dữ liệu từ máy lên Overleaf)
  4. python sync_overleaf.py status (Kiểm tra cấu hình hiện tại)
"""

import os
import sys
import json
import time
import zipfile
import argparse
import requests
from pathlib import Path

CONFIG_FILE = Path(__file__).parent / ".overleaf_config.json"
REPORT_DIR = Path(__file__).parent

# Các file / thư mục cần bỏ qua khi đồng bộ
EXCLUDE_NAMES = {
    ".git",
    ".overleaf_config.json",
    "sync_overleaf.py",
    "__pycache__",
    ".pytest_cache",
    ".vscode",
}

EXCLUDE_EXTENSIONS = {
    ".aux", ".bcf", ".bbl", ".blg", ".fdb_latexmk", ".fls",
    ".log", ".out", ".run.xml", ".synctex.gz", ".toc", ".lot", ".lof", ".xml"
}

def is_ignored(rel_path: Path) -> bool:
    for part in rel_path.parts:
        if part in EXCLUDE_NAMES or (part.startswith(".") and part != "."):
            return True
    if rel_path.suffix.lower() in EXCLUDE_EXTENSIONS:
        return True
    # Bỏ qua file PDF ở thư mục gốc (Overleaf sẽ tự biên dịch)
    if rel_path.name.lower() == "main.pdf" and len(rel_path.parts) == 1:
        return True
    return False

def load_config():
    if not CONFIG_FILE.exists():
        return {}
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_config(config):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"[OK] Da luu cau hinh vao: {CONFIG_FILE.name}")

def get_session(cookie_value):
    session = requests.Session()
    session.cookies.set("overleaf_session2", cookie_value, domain=".overleaf.com")
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    })
    return session

def cmd_config(args):
    config = load_config()
    if args.project:
        # Nếu truyền vào full URL: https://www.overleaf.com/project/670d8a... -> trích xuất ID
        project_id = args.project.strip().rstrip("/").split("/")[-1]
        config["project_id"] = project_id
    if args.cookie:
        config["cookie"] = args.cookie.strip()
    
    if not config.get("project_id"):
        config["project_id"] = input("Nhap Overleaf Project ID (hoac link du an): ").strip().rstrip("/").split("/")[-1]
    if not config.get("cookie"):
        print("\n--- HUONG DAN LAY COOKIE ---")
        print("1. Mo trinh duyet (Chrome/Edge) vao https://www.overleaf.com va dang nhap.")
        print("2. Nhan F12 -> Chon tab 'Application' (hoac 'Ung dung').")
        print("3. Ben trai chon: Storage -> Cookies -> https://www.overleaf.com")
        print("4. Tim cookie co ten 'overleaf_session2' va copy toan bo cot 'Value'.")
        print("----------------------------\n")
        config["cookie"] = input("Dan gia tri 'overleaf_session2' vao day: ").strip()

    save_config(config)
    print("[SUCCESS] Thiet lap thanh cong!")
    cmd_status(args)

def cmd_status(args):
    config = load_config()
    print("=" * 50)
    print("  TRANG THAI DONG BO OVERLEAF (LOCAL)")
    print("=" * 50)
    project_id = config.get("project_id", "(Chua thiet lap)")
    cookie_set = "[DA CAU HINH]" if config.get("cookie") else "[CHUA CO]"
    print(f"Project ID : {project_id}")
    print(f"Cookie     : {cookie_set}")
    print(f"Thu muc goc: {REPORT_DIR.resolve()}")
    print("=" * 50)

def cmd_pull(args):
    config = load_config()
    project_id = config.get("project_id")
    cookie = config.get("cookie")

    if not project_id or not cookie:
        print("[ERROR] Chua cau hinh Project ID hoac Cookie. Hay chay:")
        print("  python sync_overleaf.py config")
        sys.exit(1)

    print(f"[1/3] Dang ket noi Overleaf de tai du an {project_id}...")
    session = get_session(cookie)
    url = f"https://www.overleaf.com/project/{project_id}/download/zip"
    
    try:
        r = session.get(url, stream=True, timeout=30)
        if r.status_code == 403 or r.status_code == 401:
            print("[ERROR] Cookie het han hoac khong hop le (HTTP 401/403).")
            print("Vui long lay lai 'overleaf_session2' moi va chay: python sync_overleaf.py config")
            sys.exit(1)
        r.raise_for_status()
    except Exception as e:
        print(f"[ERROR] Khong the tai du lieu tu Overleaf: {e}")
        sys.exit(1)

    temp_zip = REPORT_DIR / "_temp_overleaf.zip"
    with open(temp_zip, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)

    # Tao ban sao luu phong truong hop can rollback
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    backup_file = REPORT_DIR / f".backup_report_{timestamp}.zip"
    print(f"[2/3] Dang sao luu thu muc local hien tai sang: {backup_file.name}...")
    with zipfile.ZipFile(backup_file, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(REPORT_DIR):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_NAMES and not d.startswith(".")]
            for file in files:
                if file not in EXCLUDE_NAMES and not file.startswith(".backup_") and file != "_temp_overleaf.zip":
                    fp = Path(root) / file
                    zipf.write(fp, fp.relative_to(REPORT_DIR))

    print(f"[3/3] Dang giai nen va cap nhat file vao {REPORT_DIR.name}...")
    with zipfile.ZipFile(temp_zip, "r") as zipf:
        for member in zipf.namelist():
            # Khong de de file cau hinh va script
            if member in EXCLUDE_NAMES:
                continue
            zipf.extract(member, REPORT_DIR)
            print(f"  + Cap nhat: {member}")

    if temp_zip.exists():
        temp_zip.unlink()

    print("\n[SUCCESS] Dong bo tu Overleaf ve Local thanh cong!")

def cmd_push(args):
    config = load_config()
    project_id = config.get("project_id")
    cookie = config.get("cookie")

    if not project_id or not cookie:
        print("[ERROR] Chua cau hinh Project ID hoac Cookie. Hay chay:")
        print("  python sync_overleaf.py config")
        sys.exit(1)

    print(f"[*] Dang kiem tra va tai len Overleaf cho du an: {project_id}...")
    
    try:
        import pyoverleaf
        api = pyoverleaf.Api()
        api.login_from_cookies({"overleaf_session2": cookie})
        io = pyoverleaf.ProjectIO(api, project_id)

        # Quet toan bo file local can push
        count = 0
        for root, dirs, files in os.walk(REPORT_DIR):
            dirs[:] = [d for d in dirs if not is_ignored(Path(root, d).relative_to(REPORT_DIR))]
            for file in files:
                file_path = Path(root) / file
                rel_path = file_path.relative_to(REPORT_DIR)
                if is_ignored(rel_path):
                    continue
                rel_str = rel_path.as_posix()
                
                # Tao thu muc neu la file nam trong subfolder
                parent_folder = rel_path.parent.as_posix()
                if parent_folder and parent_folder != ".":
                    try:
                        io.mkdir(parent_folder, parents=True, exist_ok=True)
                    except Exception:
                        pass
                
                with open(file_path, "rb") as lf:
                    content = lf.read()
                
                with io.open(rel_str, "wb") as rf:
                    rf.write(content)
                print(f"  -> Uploaded: {rel_str}")
                count += 1

        print(f"\n[SUCCESS] Da upload thanh cong {count} file len Overleaf!")

    except Exception as e:
        print(f"\n[WARNING] Gap tro ngai khi day truc tiep qua API: {e}")
        print("[*] Tu dong dong goi file cap nhat thanh: report_ready_to_upload.zip")
        zip_output = REPORT_DIR / "report_ready_to_upload.zip"
        with zipfile.ZipFile(zip_output, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(REPORT_DIR):
                dirs[:] = [d for d in dirs if d not in EXCLUDE_NAMES and not d.startswith(".")]
                for file in files:
                    if file not in EXCLUDE_NAMES and not file.startswith("."):
                        fp = Path(root) / file
                        zipf.write(fp, fp.relative_to(REPORT_DIR))
        print(f"[OK] File da tao tai: {zip_output.resolve()}")
        print("Ban chi can keo tha file zip nay vao Overleaf -> Upload -> Replace la xong ngay 100%!")

def main():
    parser = argparse.ArgumentParser(description="Tool dong bo Overleaf Free <-> Local")
    subparsers = parser.add_subparsers(dest="command")

    # Command: config
    cfg_parser = subparsers.add_parser("config", help="Cau hinh Project ID va Cookie")
    cfg_parser.add_argument("--project", "-p", help="Overleaf Project ID hoac URL")
    cfg_parser.add_argument("--cookie", "-c", help="Gia tri cookie overleaf_session2")

    # Command: pull
    subparsers.add_parser("pull", help="Tai file moi nhat tu Overleaf ve Local")

    # Command: push
    subparsers.add_parser("push", help="Day cac file Local len Overleaf")

    # Command: status
    subparsers.add_parser("status", help="Xem trang thai cau hinh")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "config":
        cmd_config(args)
    elif args.command == "pull":
        cmd_pull(args)
    elif args.command == "push":
        cmd_push(args)
    elif args.command == "status":
        cmd_status(args)

if __name__ == "__main__":
    main()
