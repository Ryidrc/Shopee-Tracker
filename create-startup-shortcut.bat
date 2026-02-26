@echo off
echo ================================================
echo   Creating Windows Startup Shortcut
echo ================================================
echo.

set SCRIPT_DIR=%~dp0
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_NAME=Sales Tracker Auto Start.lnk

echo Creating shortcut in Startup folder...
echo.

REM Create VBS script to create shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%STARTUP_FOLDER%\%SHORTCUT_NAME%" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%SCRIPT_DIR%start-all.bat" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> CreateShortcut.vbs
echo oLink.Description = "Auto-start Sales Tracker and PocketBase" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

REM Run the VBS script
cscript //nologo CreateShortcut.vbs

REM Clean up
del CreateShortcut.vbs

echo.
echo ================================================
echo   Startup Shortcut Created!
echo ================================================
echo.
echo Location: %STARTUP_FOLDER%
echo Shortcut: %SHORTCUT_NAME%
echo.
echo Sales Tracker will now automatically start when Windows boots!
echo.
echo To disable auto-start:
echo 1. Press Win+R
echo 2. Type: shell:startup
echo 3. Delete "Sales Tracker Auto Start.lnk"
echo.
pause
