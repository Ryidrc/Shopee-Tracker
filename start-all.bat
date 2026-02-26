@echo off
echo ================================================
echo    Sales Tracker - Starting All Services
echo ================================================
echo.
echo Starting PocketBase and Web Dev Server...
echo.

cd /d "%~dp0"

REM Check if pocketbase folder exists
if not exist "pocketbase" (
    echo ERROR: pocketbase folder not found!
    echo.
    echo Please create the folder and download PocketBase:
    echo 1. Create folder: mkdir pocketbase
    echo 2. Download from: https://pocketbase.io/docs/
    echo 3. Extract pocketbase.exe to the pocketbase folder
    echo.
    pause
    exit /b 1
)

REM Check if pocketbase.exe exists
if not exist "pocketbase\pocketbase.exe" (
    echo ERROR: pocketbase.exe not found!
    echo.
    echo Please download PocketBase from https://pocketbase.io/docs/
    echo Extract pocketbase.exe to: %CD%\pocketbase\
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   Starting PocketBase (Port 3001)
echo ========================================
echo.

REM Start PocketBase in a new window
start "PocketBase Server" cmd /k "cd /d "%~dp0pocketbase" && pocketbase.exe serve --http=0.0.0.0:3001"

REM Wait a moment for PocketBase to start
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Starting Vite Dev Server (Port 3000)
echo ========================================
echo.

REM Start npm dev server in a new window
start "Sales Tracker Dev Server" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ================================================
echo   Both servers are starting!
echo ================================================
echo.
echo PocketBase Admin: http://localhost:3001/_/
echo Sales Tracker:    http://localhost:3000
echo.
echo Two windows have been opened:
echo   1. PocketBase Server (Port 3001)
echo   2. Sales Tracker Dev Server (Port 3000)
echo.
echo Close those windows to stop the servers.
echo.
pause
