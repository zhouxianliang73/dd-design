# DD design · 选品中心（scheme-center / dd-design）

B 端项目协作 · 对外品牌 **DD design** · 开发域 **dd-design.com**

## 结构

| 文件 | 说明 |
|------|------|
| `1.md` / `1.html` | 选品协作主应用（legacy，不再堆新功能） |
| `showcase.json` + `showcase.html` | 公开精选案例 |
| `p.html` | 客户 magic link 入口 |
| `admin.html` | 团队 ERP（≤5 人，Supabase 登录） |
| `supabase/schema.sql` | 数据库 + RLS + magic link RPC |
| `config.public.example.json` | Supabase 公钥配置模板 |
| `catalog.json` | 全量 SKU（`featured` 控制爆款展示） |
| `channels.json` | 渠道与销售链接 |

## Supabase 初始化

1. 新建 Supabase 项目 → SQL Editor 运行 `supabase/schema.sql`
2. Authentication 开启 Email → 注册第一个用户
3. 将用户 UUID 写入 `team_members`（见 `supabase/seed.dev.sql` 注释）
4. 运行 `supabase/seed.dev.sql`（含 demo magic link token）
5. 复制 `config.public.example.json` → `config.public.json`，填入 url + anonKey

测试 magic link：`p.html?t=dev-demo-token-dd-design-2026`

## 预览

```powershell
npx --yes serve . -p 8765
# http://localhost:8765/showcase.html
# http://localhost:8765/p.html?t=dev-demo-token-dd-design-2026
```

## 销售链接

```
https://dd-design.com/1.html?channel=outdoor-living&invite=客户简称
https://dd-design.com/p.html?t={access_token}
```

详见 `SALES-LINKS.md`
