@echo off
setlocal
cd /d "%~dp0"
echo Starting DriveNear local test server...
where py >nul 2>nul
if %errorlevel%==0 (
  start "DriveNear" http://localhost:8000
  py -m http.server 8000
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "DriveNear" http://localhost:8000
  python -m http.server 8000
  goto :eof
)
echo Python was not found. Install Python or use VS Code Live Server.
echo Avoid opening index.html directly with file:// because browser security can block API requests.
pause
