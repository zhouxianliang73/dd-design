-- DD design · 小程序客户自助建项（在 schema.sql 之后执行）
-- 客户凭微信 openid 创建/查看自己的项目，无需口令

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_openid TEXT;
CREATE INDEX IF NOT EXISTS idx_projects_client_openid ON projects(client_openid);

CREATE OR REPLACE FUNCTION create_client_inquiry(
  p_openid     TEXT,
  p_channel    TEXT DEFAULT 'custom',
  p_brief      TEXT DEFAULT '',
  p_selection  JSONB DEFAULT '[]'::jsonb,
  p_meta       JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row projects%ROWTYPE;
  v_no  TEXT;
  v_name TEXT;
BEGIN
  IF p_openid IS NULL OR length(trim(p_openid)) < 8 THEN
    RAISE EXCEPTION 'invalid_openid';
  END IF;

  v_name := coalesce(nullif(trim(p_meta->>'clientName'), ''), '微信客户项目');
  v_no := 'MP-' || to_char(now(), 'YYYYMMDD') || '-'
       || lpad((SELECT count(*)::int + 1 FROM projects WHERE project_no LIKE 'MP-%')::text, 4, '0');

  INSERT INTO projects (
    project_no, client_name, channel, status, client_openid,
    selection, comm_summary, meta
  )
  VALUES (
    v_no, v_name, coalesce(nullif(p_channel, ''), 'custom'), 'inquiry', p_openid,
    coalesce(p_selection, '[]'::jsonb),
    jsonb_build_object('clientBrief', coalesce(p_brief, '')),
    coalesce(p_meta, '{}'::jsonb) || jsonb_build_object('source', 'miniprogram')
  )
  RETURNING * INTO v_row;

  IF coalesce(p_brief, '') <> '' THEN
    INSERT INTO comm_messages (project_id, channel, sender_role, body)
    VALUES (v_row.id, 'wechat', 'client', p_brief);
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'project_no', v_row.project_no,
    'access_token', v_row.access_token,
    'client_name', v_row.client_name,
    'channel', v_row.channel,
    'status', v_row.status,
    'selection', v_row.selection,
    'updated_at', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION list_client_projects(p_openid TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_openid IS NULL OR length(trim(p_openid)) < 8 THEN
    RAISE EXCEPTION 'invalid_openid';
  END IF;

  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'id', p.id,
      'project_no', p.project_no,
      'access_token', p.access_token,
      'client_name', p.client_name,
      'channel', p.channel,
      'status', p.status,
      'selection', p.selection,
      'updated_at', p.updated_at
    ) ORDER BY p.updated_at DESC)
    FROM projects p
    WHERE p.client_openid = p_openid AND p.archived = false
  ), '[]'::json);
END;
$$;

REVOKE ALL ON FUNCTION create_client_inquiry(TEXT, TEXT, TEXT, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION list_client_projects(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_client_inquiry(TEXT, TEXT, TEXT, JSONB, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION list_client_projects(TEXT) TO anon, authenticated;
