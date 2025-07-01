import threading
import subprocess
import time
import os
import signal

# 🔍 Watch the frontend pathways/ directory
WATCHED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'pathways', 'pages'))
WATCH_EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx'}
EXCLUDE = {'node_modules', '.DS_Store', ".next", ".git"}

current_process = None  # Global reference to the running process

def file_hashes():
    hashes = {}
    for root, dirs, files in os.walk(WATCHED_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE]
        for f in files:
            ext = os.path.splitext(f)[1]
            if ext in WATCH_EXTENSIONS:
                path = os.path.join(root, f)
                try:
                    hashes[path] = os.stat(path).st_mtime
                except FileNotFoundError:
                    continue
    return hashes

def run_bootstrap():
    global current_process

    # Kill previous if still running
    if current_process and current_process.poll() is None:
        print("🛑 Terminating previous bootstrapper...")
        try:
            current_process.terminate()
            current_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            current_process.kill()

    print("🧠 Starting new assistant bootstrapper...")
    current_process = subprocess.Popen(["python", "manage.py", "bootstrap_assistant", "--force"])

def watch_and_run_bootstrap():
    print(f"👁️ Watching frontend directory: {WATCHED_DIR}")
    print("👀 Watching for frontend file changes...")
    try:
        last_hashes = file_hashes()
        while True:
            time.sleep(2)
            new_hashes = file_hashes()

            # ✅ Detect what changed
            changed_files = [
                path for path in new_hashes
                if path not in last_hashes or new_hashes[path] != last_hashes[path]
            ]

            if changed_files:
                print("🔁 Detected frontend file changes:")
                for f in changed_files:
                    print(f"   - {os.path.relpath(f, WATCHED_DIR)}")
                run_bootstrap()
                last_hashes = new_hashes
    except Exception as e:
        print(f"❌ Watcher thread crashed: {e}")


def start_in_background():
    print("🧵 Starting assistant autobootstrap watcher (in background thread)...")
    thread = threading.Thread(target=watch_and_run_bootstrap, daemon=True)
    thread.start()
