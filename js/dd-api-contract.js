/**
 * DD design · 平台 API 契约（与 Supabase / 腾讯云实现无关）
 * 迁移时只需替换 js/providers/api-*.js，页面继续调用 DDApi.*
 *
 * CONTRACT_VERSION 变更时表示会话/响应结构有 breaking change。
 */
(function (global) {
  var CONTRACT_VERSION = '1';

  var ERROR = {
    NOT_CONFIGURED: 'platform_not_configured',
    SUPABASE_NOT_CONFIGURED: 'supabase_not_configured',
    TENCENT_NOT_CONFIGURED: 'tencent_not_configured',
    LOGIN_FAILED: 'login_failed',
    NOT_TEAM_MEMBER: 'not_team_member',
    INVALID_TOKEN: 'invalid_token',
    WECHAT_LOGIN_NOT_READY: 'wechat_login_not_ready',
    REQUEST_FAILED: 'request_failed',
  };

  var TEAM_ROLES = ['admin', 'sales', 'design', 'procurement'];

  /** 团队可见能力（迁移后云函数沿用同一套 role 名） */
  var CAPABILITIES = {
    admin: ['team.projects', 'team.create', 'procurement.view', 'procurement.edit'],
    design: ['team.projects', 'team.create', 'procurement.view', 'procurement.edit'],
    procurement: ['procurement.view', 'procurement.edit'],
    sales: ['team.projects', 'team.create'],
  };

  var STATUS_LABELS = {
    inquiry: '询价',
    scheme: '方案',
    quoted: '报价',
    ordered: '下单',
    production: '生产',
    shipped: '发货',
  };

  /** 客户端 Magic Link  bundle — 不得包含采购厂价等 internal 字段 */
  var CLIENT_BUNDLE_KEYS = ['project', 'messages', 'media'];

  /** Live project 对客户可见字段 */
  var CLIENT_PROJECT_FIELDS = [
    'id', 'project_no', 'client_name', 'channel', 'status',
    'invite_label', 'selection', 'quote_lines', 'comm_summary', 'meta', 'updated_at',
  ];

  function statusLabel(code) {
    return STATUS_LABELS[code] || code;
  }

  function hasCapability(role, cap) {
    var list = CAPABILITIES[role] || [];
    return list.indexOf(cap) >= 0;
  }

  /**
   * 统一登录会话（Supabase JWT / 未来腾讯云 token 都映射到此结构）
   */
  function normalizeSession(raw, provider) {
    if (!raw || !raw.access_token) return null;
    var user = raw.user || {};
    return {
      provider: provider || raw.provider || 'supabase',
      accessToken: raw.access_token,
      refreshToken: raw.refresh_token || '',
      expiresAt: raw.expires_at || raw.expiresAt || null,
      user: {
        id: user.id || '',
        email: user.email || '',
        role: user.role || raw.role || '',
        name: user.name || '',
        wechatUnionId: user.wechat_unionid || user.wechatUnionId || '',
      },
      raw: raw,
    };
  }

  function normalizeTeamMember(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name || '',
      role: row.role || 'sales',
      wechatUnionId: row.wechat_unionid || '',
      wechatOpenId: row.wechat_openid || '',
      authProvider: row.auth_provider || 'email',
    };
  }

  function normalizeProjectRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      projectNo: row.project_no,
      clientName: row.client_name,
      channel: row.channel,
      status: row.status,
      accessToken: row.access_token,
      inviteLabel: row.invite_label,
      updatedAt: row.updated_at,
    };
  }

  function normalizeCreatedProject(data) {
    return {
      id: data.id,
      projectNo: data.project_no,
      accessToken: data.access_token,
      clientName: data.client_name,
      channel: data.channel,
    };
  }

  global.DDApiContract = {
    CONTRACT_VERSION: CONTRACT_VERSION,
    ERROR: ERROR,
    TEAM_ROLES: TEAM_ROLES,
    CAPABILITIES: CAPABILITIES,
    STATUS_LABELS: STATUS_LABELS,
    CLIENT_BUNDLE_KEYS: CLIENT_BUNDLE_KEYS,
    CLIENT_PROJECT_FIELDS: CLIENT_PROJECT_FIELDS,
    statusLabel: statusLabel,
    hasCapability: hasCapability,
    normalizeSession: normalizeSession,
    normalizeTeamMember: normalizeTeamMember,
    normalizeProjectRow: normalizeProjectRow,
    normalizeCreatedProject: normalizeCreatedProject,
  };
})(window);
