# Intake · 微信 / WhatsApp 统一归档

供应商报价、沟通记录从 **项目群** 进入系统，不依赖小程序录入。微信与 WhatsApp 共用同一套 `projects/` 目录与解析脚本。

## 角色

| 角色 | 在群里做什么 | 系统侧 |
|------|----------------|--------|
| 供应商 / 客户 | 发报价 Excel、PDF、图片、文字 | intake 写入对应项目 |
| 管理员（你） | 在项目群内，用桥接工具把消息/文件送进 intake | 配置群映射、发布确认、白名单 |
| 授权同事 | 只看方案内「采购询价」 | 不在群里也能看（需授权） |

## 数据流

```
WhatsApp 群 / 微信项目群
        ↓  OpenClaw / 导出 JSONL / 手动 message 命令
intake/process_intake.py
        ↓  按群名匹配 project_slug
projects/{slug}/conversation.jsonl   ← 文字消息
projects/{slug}/quotes/*.xlsx        ← 报价 Excel（文件名含「报价/quote/清单」等）
projects/{slug}/materials/           ← 图片与其它附件
        ↓  npm run intake:sync-quotes
inquiry-bundle + miniprogram/data/inquiry-*.js
        ↓  管理员发布 + 白名单（后台/小程序权限）
方案页「采购询价」版块（仅授权可见）
```

## 1. 配置群 → 项目

复制 `config.example.yaml` 为 `config.local.yaml`，填写实际群名：

```yaml
channels:
  whatsapp:
    enabled: true
    groups:
      - match: AliReza
        project_slug: alireza-entry-cabinet
        product_name: Entry Cabinet    # 可选：该产品询价展示名
  wechat:
    enabled: true
    account: 你的微信号
    groups:
      - match: 陈先生厨柜
        project_slug: demo-kitchen-001
        product_name: 不锈钢厨柜
      - match: 直泰书柜
        project_slug: stainless-bookcase
        product_name: 不锈钢书柜
```

`match` 为群名子串匹配；同一渠道下先匹配到的规则生效。

## 2. 写入消息 / 附件

### 单条（测试）

```bash
python intake/process_intake.py message \
  --channel wechat \
  --chat "陈先生厨柜沟通群" \
  --sender "钢鹏达" \
  --text "不锈钢厨柜报价单" \
  --file "D:/downloads/厨柜报价.xlsx"
```

WhatsApp 示例：

```bash
python intake/process_intake.py message \
  --channel whatsapp \
  --chat "AliReza Entry Cabinet" \
  --sender "Supplier A" \
  --text "Quotation attached" \
  --file "/path/to/quote.xlsx"
```

### 批量（OpenClaw / 导出工具）

每行一条 JSON，字段：`channel`, `chat`, `sender`, `text`, `attachment`（绝对路径）：

```bash
python intake/process_intake.py batch path/to/messages.jsonl
```

## 3. 解析报价并同步小程序

群里的 Excel 落入 `projects/{slug}/quotes/` 后执行：

```bash
npm run intake:sync-quotes
```

会：

- 解析每个 `.xlsx` 为 `inquiry-bundle`（多供应商横向比价数据）
- 写入 `miniprogram/data/inquiry-{slug}.js`
- 在 `project.json` 的 `procurementInquiries` 中登记产品（可多项）

## 4. 管理员发布（尚未全自动）

Intake 只负责 **归档与解析**。要在小程序方案里显示：

1. `procurement.status` 设为 `confirmed`（管理员发布确认）
2. 将查看人加入采购白名单 + 本项目授权

未发布或未授权的用户 **看不到**「采购询价」版块。

## 5. 与 WhatsApp H5 / 小程序的关系

| 端 | 作用 |
|----|------|
| WhatsApp 群 | 收报价，经 intake 进 `projects/` |
| 微信项目群 | 同上 |
| `inquiry-view.html` | Web 只读预览某 slug 询价 |
| 小程序方案页 | 授权后查看，只读 |

录入入口在 **intake 管道**，不是客户在小程序里填报价。

## 依赖

```bash
pip install pyyaml
npm install
```
