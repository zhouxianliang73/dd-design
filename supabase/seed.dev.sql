-- DD design · dev seed (run AFTER schema.sql + first Auth user exists)
--
-- 1. Sign up in Supabase Auth (e.g. admin@dd-design.com)
-- 2. Replace USER_UUID below with auth.users.id
-- 3. Run this file

-- INSERT INTO team_members (id, name, role)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Admin', 'admin');

-- Demo live project with fixed token for local magic-link testing
INSERT INTO projects (
  project_no,
  client_name,
  channel,
  status,
  access_token,
  invite_label,
  selection,
  quote_lines,
  comm_summary,
  meta
) VALUES (
  'DD-2026-DEMO',
  '演示客户',
  'outdoor-living',
  'scheme',
  'dev-demo-token-dd-design-2026',
  'Demo',
  '[
    {"catalogId": "f-004", "name": "户外藤编沙发", "qty": 1, "unit": "个"},
    {"catalogId": "f-003", "name": "现代不锈钢餐椅", "qty": 4, "unit": "把"}
  ]'::jsonb,
  '[]'::jsonb,
  '{"designerSummary": "演示方案摘要 — 连接 Supabase 后可替换为真实数据"}'::jsonb,
  '{"note": "dev seed — delete before production"}'::jsonb
)
ON CONFLICT (project_no) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  updated_at = now();

INSERT INTO comm_messages (project_id, channel, sender_role, body)
SELECT p.id, 'wechat', 'client', '您好，我们需要户外遮阳方案，请推荐几款。'
FROM projects p
WHERE p.project_no = 'DD-2026-DEMO'
  AND NOT EXISTS (
    SELECT 1 FROM comm_messages m
    WHERE m.project_id = p.id AND m.body LIKE '您好，我们需要户外遮阳%'
  );

INSERT INTO comm_messages (project_id, channel, sender_role, body)
SELECT p.id, 'web', 'team', '已为您准备 2 款推荐，请查看下方方案清单。'
FROM projects p
WHERE p.project_no = 'DD-2026-DEMO'
  AND NOT EXISTS (
    SELECT 1 FROM comm_messages m
    WHERE m.project_id = p.id AND m.body LIKE '已为您准备 2 款%'
  );

-- Magic link test URL (after deploy):
--   https://dd-design.com/p.html?t=dev-demo-token-dd-design-2026
-- Local:
--   http://localhost:8765/p.html?t=dev-demo-token-dd-design-2026
