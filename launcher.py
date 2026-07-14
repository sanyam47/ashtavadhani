import os
import sys
import webbrowser
import time
import uvicorn
from multiprocessing import freeze_support

# Required for PyInstaller support
if __name__ == '__main__':
    freeze_support()
    
    # Wait 1.5 seconds for the server to spin up, then open browser
    from threading import Timer
    def open_browser():
        webbrowser.open("http://127.0.0.1:8000")
    Timer(1.5, open_browser).start()
    
    # Launch the FastAPI app
    from main import app
    uvicorn.run(app, host="127.0.0.1", port=8000)
