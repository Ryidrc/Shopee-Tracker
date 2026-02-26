@echo off
echo ================================================
echo    Sales Tracker - Web Server Starter
echo ================================================
echo.

cd /d "%~dp0"

REM Check if dist directory exists
if not exist "dist" (
    echo ERROR: dist directory not found!
    echo Building the application first...
    call npm run build
    if errorlevel 1 (
        echo Build failed!
        pause
        exit /b 1
    )
)

echo Starting Sales Tracker web server...
echo.
echo Server will be available at:
echo   - On this PC: http://localhost:3000
echo   - On other devices: http://YOUR_PC_IP:3000
echo.
echo To find your PC's IP address, run: ipconfig
echo.
echo Press Ctrl+C to stop the server
echo.

npx serve -s dist -l 3000
