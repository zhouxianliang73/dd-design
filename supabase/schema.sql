-- DD design · Supabase schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
--
-- Setup order:
--   1. Run this file
--   2. Enable Email auth (Authentication → Providers)
--   3. Create first user in Auth, then insert into team_members (see seed.dev.sql)
--   4. Copy Project URL + anon key → config.public.json

-- ── Team (≤5 people) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_members (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT '',
  role            TEXT NOT NULL DEFAULT 'sales'
                  CHECK (role IN ('admin', 'sales', 'design', 'procurement')),
  wechat_unionid  TEXT,
  wechat_openid   TEXT,
  auth_provider   TEXT NOT NULL DEFAULT 'email'
                  CHECK (auth_provider IN ('email', 'wechat')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_wechat_unionid
  ON team_members (wechat_unionid) WHERE wechat_unionid IS NOT NULL;

CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT count(*)::int FROM team_members) >= 5 THEN
    RAISE EXCEPTION 'team_member_limit_reached: max 5 team members';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS team_member_limit ON team_members;
CREATE TRIGGER team_member_limit
  BEFORE INSERT ON team_members
  FOR EACH ROW EXECUTE FUNCTION check_team_member_limit();

-- ── Live projects (client data — not in Git) ─────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_no    TEXT UNIQUE,
  client_name   TEXT NOT NULL DEFAULT '',
  channel       TEXT NOT NULL DEFAULT 'custom',
  status        TEXT NOT NULL DEFAULT 'inquiry'
                CHECK (status IN (
                  'inquiry', 'scheme', 'quoted',
                  'ordered', 'production', 'shipped'
                )),
  access_token  TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  invite_label  TEXT NOT NULL DEFAULT '',
  selection     JSONB NOT NULL DEFAULT '[]'::jsonb,
  quote_lines   JSONB NOT NULL DEFAULT '[]'::jsonb,
  comm_summary  JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  archived      BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_access_token ON projects(access_token);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_channel ON projects(channel);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE OR REPLACE FUNCTION set_projects_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_projects_updated_at();

-- ── Communication & media ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comm_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL DEFAULT 'wechat'
               CHECK (channel IN ('wechat', 'whatsapp', 'web')),
  sender_role  TEXT NOT NULL DEFAULT 'team'
               CHECK (sender_role IN ('client', 'team')),
  body         TEXT NOT NULL DEFAULT '',
  attachments  JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_messages_project ON comm_messages(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS project_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category    TEXT NOT NULL DEFAULT 'scheme'
              CHECK (category IN ('client_ref', 'scheme', 'production', 'shipping')),
  url         TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_media_project ON project_media(project_id, category);

-- ── Procurement (internal — not in client magic link) ─────────────

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

-- ── Row level security ───────────────────────────────────────────

ALTER TABLE team_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comm_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_media  ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_comparisons ENABLE ROW LEVEL SECURITY;

-- Team: read team roster
DROP POLICY IF EXISTS team_members_select ON team_members;
CREATE POLICY team_members_select ON team_members
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm WHERE tm.id = auth.uid()));

-- Team: full CRUD on projects
DROP POLICY IF EXISTS projects_team_select ON projects;
CREATE POLICY projects_team_select ON projects
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm WHERE tm.id = auth.uid()));

DROP POLICY IF EXISTS projects_team_insert ON projects;
CREATE POLICY projects_team_insert ON projects
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM team_members tm WHERE tm.id = auth.uid()));

DROP POLICY IF EXISTS projects_team_update ON projects;
CREATE POLICY projects_team_update ON projects
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm WHERE tm.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members tm WHERE tm.id = auth.uid()));

DROP POLICY IF EXISTS projects_team_delete ON projects;
CREATE POLICY projects_team_delete ON projects
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = auth.uid() AND tm.role = 'admin'
    )
  );

-- Team: comm & media
DROP POLICY IF EXISTS comm_messages_team ON comm_messages;
CREATE POLICY comm_messages_team ON comm_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm WHERE tm.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members tm WHERE tm.id = auth.uid()));

DROP POLICY IF EXISTS project_media_team ON project_media;
CREATE POLICY project_media_team ON project_media
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members tm WHERE tm.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members tm WHERE tm.id = auth.uid()));

-- Procurement: admin / design / procurement only (sales cannot read)
DROP POLICY IF EXISTS procurement_internal ON procurement_comparisons;
CREATE POLICY procurement_internal ON procurement_comparisons
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

-- ── Magic link RPC (anon — no login for clients) ─────────────────
-- 注意：仅返回 selection / quote_lines / comm_summary，不含 procurement_comparisons

CREATE OR REPLACE FUNCTION get_client_project_bundle(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_result     JSON;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  SELECT id INTO v_project_id
  FROM projects
  WHERE access_token = p_token AND archived = false;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  SELECT json_build_object(
    'project', (
      SELECT json_build_object(
        'id', p.id,
        'project_no', p.project_no,
        'client_name', p.client_name,
        'channel', p.channel,
        'status', p.status,
        'invite_label', p.invite_label,
        'selection', p.selection,
        'quote_lines', p.quote_lines,
        'comm_summary', p.comm_summary,
        'meta', p.meta,
        'updated_at', p.updated_at
      )
      FROM projects p WHERE p.id = v_project_id
    ),
    'messages', COALESCE((
      SELECT json_agg(json_build_object(
        'id', m.id,
        'channel', m.channel,
        'sender_role', m.sender_role,
        'body', m.body,
        'attachments', m.attachments,
        'created_at', m.created_at
      ) ORDER BY m.created_at ASC)
      FROM comm_messages m WHERE m.project_id = v_project_id
    ), '[]'::json),
    'media', COALESCE((
      SELECT json_agg(json_build_object(
        'id', pm.id,
        'category', pm.category,
        'url', pm.url,
        'note', pm.note,
        'created_at', pm.created_at
      ) ORDER BY pm.created_at ASC)
      FROM project_media pm WHERE pm.project_id = v_project_id
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION get_client_project_bundle(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_client_project_bundle(TEXT) TO anon, authenticated;

-- Team helper: create project and return magic link token
CREATE OR REPLACE FUNCTION create_live_project(
  p_client_name TEXT,
  p_channel     TEXT DEFAULT 'custom',
  p_invite_label TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row projects%ROWTYPE;
  v_no  TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.id = auth.uid()) THEN
    RAISE EXCEPTION 'not_team_member';
  END IF;

  v_no := 'DD-' || to_char(now(), 'YYYY') || '-'
       || lpad((SELECT count(*)::int + 1 FROM projects)::text, 4, '0');

  INSERT INTO projects (project_no, client_name, channel, invite_label, created_by)
  VALUES (v_no, coalesce(p_client_name, ''), coalesce(p_channel, 'custom'),
          coalesce(p_invite_label, ''), auth.uid())
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'project_no', v_row.project_no,
    'access_token', v_row.access_token,
    'client_name', v_row.client_name,
    'channel', v_row.channel
  );
END;
$$;

REVOKE ALL ON FUNCTION create_live_project(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_live_project(TEXT, TEXT, TEXT) TO authenticated;
