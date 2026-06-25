@echo off
cd /d "%~dp0"
set PORT=8765
set URL=http://localhost:%PORT%/1.html

echo.
echo  DD Deep Design 选品中心 — 本地预览
echo  ----------------------------------------
echo  地址: %URL%
echo  说明: 请勿双击 1.html，必须通过本地服务打开
echo  关闭: 关掉本窗口或按 Ctrl+C
echo.

where curl >nul 2>&1 && curl -s -o nul "http://localhost:%PORT%/" 2>nul && (
    echo  端口 %PORT% 已有服务，直接打开浏览器...
    start "" "%URL%"
    pause
    exit /b 0
)

start "DD-serve-%PORT%" cmd /c "npx --yes serve . -p %PORT%"
echo  正在启动服务...
timeout /t 3 /nobreak >nul
start "" "%URL%"
echo  已在浏览器打开；若空白请等几秒后刷新。
pause
