# DD Deep Design · 选品中心

B 端项目协作工具（GitHub Pages: [dd-design](https://zhouxianliang73.github.io/dd-design/)）

## 品牌

- **DD Deep Design** — 核心品牌
- 本产品对外名称：**选品中心**（非独立站，销售发链接进入）

## 开发

| 文件 | 说明 |
|------|------|
| `1.md` | 源码（改这里） |
| `1.html` | 与 `1.md` 同步后 push |
| `catalog.json` | 全量产品库 |
| `channels.json` | 独立站 channel → 可见 SKU + 文案 |
| `quote-templates.json` | 清单结构 |
| `SALES-LINKS.md` | 销售链接模板 |

战略文档：[`../_workspace/PRODUCT-STRATEGY.md`](../_workspace/PRODUCT-STRATEGY.md)

## 销售链接示例

```
https://zhouxianliang73.github.io/dd-design/1.html?channel=outdoor-living&invite=客户名
https://zhouxianliang73.github.io/dd-design/1.html?channel=outdoor-kitchen&invite=客户名
```

## 预览

```powershell
npx --yes serve .
# http://localhost:3000/1.html?channel=outdoor-living
```
