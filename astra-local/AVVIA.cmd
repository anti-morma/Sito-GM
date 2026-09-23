@echo off
cd /d "%~dp0"
call npm run dev -- -H 127.0.0.1
pause
