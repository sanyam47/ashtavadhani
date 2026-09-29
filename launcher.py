import os
import sys
import time
import uvicorn
import webview
from threading import Thread
from multiprocessing import freeze_support

# Required for PyInstaller support
if __name__ == '__main__':
    freeze_support()
    
    # Start the FastAPI server in a background thread
    def start_server():
        from main import app
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
    
    server_thread = Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Give the server a moment to start
    time.sleep(2)
    
    # Open a native desktop window instead of the browser
    webview.create_window(
        "Ashtavadhani - AI Video Editor",
        "http://127.0.0.1:8000/dashboard",
        width=1400,
        height=900,
        resizable=True,
        min_size=(1024, 700)
    )
    webview.start()
