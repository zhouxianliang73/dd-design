# 手动测试 intake
# 用法: .\intake\test-intake.ps1

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "=== 项目列表 ===" -ForegroundColor Cyan
python intake/process_intake.py list

Write-Host "`n=== 写入测试消息 ===" -ForegroundColor Cyan
python intake/process_intake.py message `
  --channel whatsapp `
  --chat "AliReza Entry Cabinet" `
  --sender "TestBot" `
  --text "intake pipeline smoke test"

Write-Host "`n=== 更新后列表 ===" -ForegroundColor Cyan
python intake/process_intake.py list
