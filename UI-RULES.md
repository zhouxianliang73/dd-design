# UI 统一规则 · DD Deep Design 选品中心

与 `delivery-doc-tokens.css`、交付模板共用灰阶；**尽量不用彩色**。

## 字色（全黑 `#1a1a1a` 仅大标题级）

| Token | 色值 | 用途 |
|-------|------|------|
| `--text-black` | #1a1a1a | 极少：页面级标题 |
| `--text-strong` | #333 | 关键信息、小节标题 |
| `--text-default` | #444 | 正文 |
| `--text-muted` | #666 | 次要说明 |
| `--text-light` | #999 | 元数据、Tab 未选 |
| `--text-faint` | #bbb | 占位、极弱提示 |

## 字重

| Token | 值 | 用途 |
|-------|-----|------|
| `--fw-bold` | 600 | 关键信息（非 700） |
| `--fw-medium` | 500 | 标签、按钮 |
| `--fw-normal` | 400 | 正文 |

## 字号

`11 · 12 · 13 · 14 · 16 · 20` — 见 `:root` 中 `--fs-xs` … `--fs-xl`

## 凹凸（代替颜色强调）

| 层级 | 表面 | 效果 |
|------|------|------|
| 页面 | `--bg` #ececec | 底 |
| 父容器 | `--surface-raised` 白 + `--elevation-1` | 卡片、项目壳头部 |
| 子容器 | `--surface-nested` #f7f7f7 | 项目 body |
| 凹陷 | `--surface-inset` + `--shadow-inset` | 输入框、子清单区 |
| 悬停 | `--elevation-hover` | 卡片、按钮、可点行 |

## 两类强调（不要用彩色区分）

1. **关键信息**：`font-weight: 600` + `--text-strong`，可加字号一级  
2. **关键操作**：`--action-bg` #333 按钮 + 悬停抬升；普通操作为白底描边按钮  

## 父 / 子容器（项目清单）

```
.project-shell          ← 白底、细边框（父）
  .project-shell-hd     ← 白底、底部分割线
  .project-shell-body   ← 浅灰底（子层）
    .proj-section-hd    ← 白底、分组标题
    .proj-section-bd    ← 白底 inset、清单表（孙层）
```

## 修改样式时

1. 先改 `:root` token  
2. 同步 `delivery-doc-tokens.css`  
3. 避免新增 `--primary` 彩色用法
