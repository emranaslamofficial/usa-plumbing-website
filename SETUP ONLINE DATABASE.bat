@echo off
title Online database setup
cd /d "%~dp0"
"%~dp0tools\node\node.exe" "%~dp0tools\setup-online-db.mjs"
echo.
pause
