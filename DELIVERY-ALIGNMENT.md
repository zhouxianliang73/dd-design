# 交付清单对齐说明

> DD Deep Design · 选品中心 `1.md` ↔ `delivery-system` 交付标准

## 1. 结构：交付清单 = 1.md 里的清单结构

**不是**把整份 `1.md` 拷进 `delivery-system`。

对齐的是 **数据结构与板块逻辑**：

| 1.md（协作壳） | delivery-system（对外文档） |
|----------------|----------------------------|
| `quoteCategories[]` 分组（柜体/台面…） | 各 `.sec` 板块或 `.dt` 表格分组 |
| 每组 `products[]` 行项 | 清单行（名称、规格、材质、数量、金额） |
| 沟通记录、客户图、方案图 | 客户原始需求、参考图、设计方案 |
| 生产/货运记录 | 物流 & 清关、工作推进清单 |

**单一真相源（结构定义）：**

- `quote-templates.json` → 有哪些分组、叫什么
- 项目实例里的 `quoteCategories` → 具体行项

将来从壳 **导出交付页** = 用同一套 `quoteCategories` 填入 `delivery-template-standard.html` 对应章节。

## 2. 样式：壳参考交付标准

视觉参考文件：`delivery-system/delivery-template-standard.html`

| 交付模板 | 已同步到 1.md |
|----------|----------------|
| 背景 `#f5f5f5`、正文 `#333` | `:root --bg`、灰阶 |
| 标题 26px `#222`、小节 16px `#555` | 项目壳、`.proj-section-hd` |
| 正文 13–14px、辅助 `#666` `#999` `#bbb` | `--text-*` |
| 强调色 `#e17055` 节制使用 | `--primary` |
| 表格 `.dt` 细线、合计橙色顶线 | `.project-tw`、`.project-shell-total` |
| 轻阴影、6px 圆角 | `--shadow-*`、`--radius-*` |

抽取对照表见同目录 `delivery-doc-tokens.css`（与交付模板同步维护）。

## 3. 分工（再强调）

| 仓库 | 职责 |
|------|------|
| **scheme-center / 1.md** | 可编辑协作清单 + 沟通 + 过程图；样式对齐交付 |
| **delivery-system** | 对外只读交付 HTML 模板；**结构跟 quote-templates 一致** |
| **catalog.json** | SKU 数据源 |

## 4. 待办（后续）

- [ ] 导出：项目 JSON → 渲染 `delivery-template-standard.html`
- [ ] `delivery-system` 增加「清单-only」模板（仅 quote 板块，无物流样例）
- [ ] 打印样式与 1.md 项目壳共用 `@media print` 规则
