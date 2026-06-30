@echo off
title NEXUS AI - Chatbot Server
echo ===================================================
echo               NEXUS AI CHATBOT SERVER              
echo ===================================================
echo.
echo Activating virtual environment (venv)...
if not exist "venv" (
    echo [ERROR] Virtual environment venv not found!
    echo Please run: python -m venv venv
    pause
    exit /b
)
call venv\Scripts\activate
echo.
echo Running app.py...
echo Server starting at http://localhost:5000
echo Close this window to stop the server.
echo ===================================================
echo.
python app.py
pause
