@echo off
cd /d "%~dp0"
copy /Y "miniprogram\app.full.json" "miniprogram\app.json"
echo 已恢复完整 Tab 配置（app.full.json -> app.json）
echo 请在微信开发者工具中重新编译。
pause
