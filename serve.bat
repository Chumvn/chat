@echo off
echo ============================================
echo   CHUM P2P CHAT - Local Server
echo ============================================
echo.

:: Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
    )
)

echo   URL: http://localhost:8080
echo   LAN: http://%LOCAL_IP%:8080
echo.
echo   Scan QR from another device on same WiFi!
echo   Press Ctrl+C to stop.
echo ============================================

python -m http.server 8080
