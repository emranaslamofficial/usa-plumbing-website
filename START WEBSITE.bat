@echo off
title USA Plumbing - Website, API and Database (keep this window open)
cd /d "%~dp0"
"%~dp0tools\node\node.exe" "%~dp0tools\run-all.mjs" %*
echo.
pause
