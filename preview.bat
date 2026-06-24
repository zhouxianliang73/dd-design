@echo off
cd /d "%~dp0"
echo DD Deep Design 本地预览
echo 浏览器打开: http://localhost:8765/1.html
echo 按 Ctrl+C 停止服务
npx --yes serve . -p 8765
