-- 迁移友好字段 · 在 Supabase SQL Editor 对已建库执行本文件
-- 新库可直接用更新后的 schema.sql

-- 团队：微信登录预留 + 采购角色
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS wechat_unionid TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS wechat_openid TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'email';

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_wechat_unionid
  ON team_members (wechat_unionid) WHERE wechat_unionid IS NOT NULL;

ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('admin', 'sales', 'design', 'procurement'));

ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_auth_provider_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_auth_provider_check
  CHECK (auth_provider IN ('email', 'wechat'));

-- 材料采购对比（内部专用，不进 Magic Link / quote_lines）
CREATE TABLE IF NOT EXISTS procurement_comparisons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  project_slug TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT '',
  currency     TEXT NOT NULL DEFAULT 'CNY',
  rows         JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes        TEXT NOT NULL DEFAULT '',
  updated_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_procurement_project ON procurement_comparisons(project_id);
CREATE INDEX IF NOT EXISTS idx_procurement_slug ON procurement_comparisons(project_slug);

ALTER TABLE procurement_comparisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS procurement_admin_design ON procurement_comparisons;
CREATE POLICY procurement_admin_design ON procurement_comparisons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = auth.uid()
        AND tm.role IN ('admin', 'design', 'procurement')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = auth.uid()
        AND tm.role IN ('admin', 'design', 'procurement')
    )
  );

COMMENT ON TABLE procurement_comparisons IS
  'Internal only — never expose via get_client_project_bundle or client APIs';
