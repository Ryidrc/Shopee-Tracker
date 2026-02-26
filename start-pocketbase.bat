@echo off
echo ========================================
echo   PocketBase Server for Sales Tracker
echo ========================================
echo.
echo Starting PocketBase on port 3001...
echo Admin Panel: http://localhost:3001/_/
echo.

cd pocketbase 2>nul
if errorlevel 1 (
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

if not exist pocketbase.exe (
    echo ERROR: pocketbase.exe not found!
    echo.
    echo Please download PocketBase from https://pocketbase.io/docs/
    echo Extract pocketbase.exe to: %CD%
    echo.
    pause
    exit /b 1
)

echo PocketBase found! Starting server...
echo.
pocketbase.exe serve --http=0.0.0.0:3001

pause
