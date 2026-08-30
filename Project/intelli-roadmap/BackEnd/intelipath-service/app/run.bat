@echo off
setlocal
echo Starting Intelipath AI Service API...

cd /d "%~dp0.."

if not exist "venv\Scripts\python.exe" (
    echo Virtual environment not found. Run: python -m venv venv
    pause
    exit /b 1
)

venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
endlocal
