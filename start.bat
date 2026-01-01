@echo off
REM Fabric Toolbox Dashboard - Start Script (Windows)
REM This script installs dependencies and starts the development server

cd /d "%~dp0"

echo ==========================================
echo   Fabric Toolbox Dashboard
echo ==========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/2] Installing dependencies...
    call npm install
    echo.
) else (
    echo [1/2] Dependencies already installed
)

echo [2/2] Starting development server...
echo.
echo   Dashboard will be available at:
echo   http://localhost:5173
echo.
echo   Press Ctrl+C to stop
echo ==========================================
echo.

npm run dev
