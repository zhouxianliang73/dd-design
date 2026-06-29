/**
 * Supabase 实现 · 实现 DDApiContract 定义的能力
 * 迁移到腾讯云后本文件可退役，页面不改。
 */
(function (global) {
  var C = global.DDApiContract;

  function supabaseHeaders(anonKey, extra) {
    return Object.assign({
      apikey: anonKey,
      Authorization: 'Bearer ' + anonKey,
      'Content-Type': 'application/json',
    }, extra || {});
  }

  function isConfigured(config) {
    var sb = (config && config.supabase) || {};
    return !!(sb.url && sb.anonKey && sb.url.indexOf('YOUR_PROJECT') < 0);
  }

  async function rpc(config, fnName, body, accessToken) {
    var sb = config.supabase;
    var headers = supabaseHeaders(sb.anonKey);
    if (accessToken) {
      headers.Authorization = 'Bearer ' + accessToken;
    }
    var res = await fetch(sb.url + '/rest/v1/rpc/' + fnName, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body || {}),
    });
    var text = await res.text();
    var data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }
    if (!res.ok) {
      var msg = (data && (data.message || data.error)) || res.statusText;
      throw new Error(msg || C.ERROR.REQUEST_FAILED);
    }
    return data;
  }

  async function loginWithPassword(config, email, password) {
    if (!isConfigured(config)) throw new Error(C.ERROR.SUPABASE_NOT_CONFIGURED);
    var sb = config.supabase;
    var res = await fetch(sb.url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: supabaseHeaders(sb.anonKey),
      body: JSON.stringify({ email: email, password: password }),
    });
    var data = await res.json();
    if (!res.ok) {
      throw new Error((data.error_description || data.msg) || C.ERROR.LOGIN_FAILED);
    }
    return C.normalizeSession(data, 'supabase');
  }

  async function loginWithWechatQr() {
    throw new Error(C.ERROR.WECHAT_LOGIN_NOT_READY);
  }

  async function fetchCurrentMember(config, session) {
    if (!isConfigured(config)) throw new Error(C.ERROR.SUPABASE_NOT_CONFIGURED);
    var sb = config.supabase;
    var userId = session && session.user && session.user.id;
    if (!userId) throw new Error(C.ERROR.NOT_TEAM_MEMBER);

    var res = await fetch(
      sb.url + '/rest/v1/team_members?id=eq.' + encodeURIComponent(userId)
        + '&select=id,name,role,wechat_unionid,wechat_openid,auth_provider',
      {
        headers: supabaseHeaders(sb.anonKey, {
          Authorization: 'Bearer ' + session.accessToken,
        }),
      }
    );
    var rows = await res.json();
    if (!res.ok) throw new Error((rows.message) || C.ERROR.REQUEST_FAILED);
    var member = C.normalizeTeamMember(rows[0]);
    if (!member) throw new Error(C.ERROR.NOT_TEAM_MEMBER);

    session.user.role = member.role;
    session.user.name = member.name;
    session.user.wechatUnionId = member.wechatUnionId;
    return member;
  }

  async function fetchTeamProjects(config, session) {
    if (!isConfigured(config)) throw new Error(C.ERROR.SUPABASE_NOT_CONFIGURED);
    var sb = config.supabase;
    var res = await fetch(
      sb.url + '/rest/v1/projects?select=id,project_no,client_name,channel,status,access_token,invite_label,updated_at'
        + '&archived=eq.false&order=updated_at.desc',
      {
        headers: supabaseHeaders(sb.anonKey, {
          Authorization: 'Bearer ' + session.accessToken,
        }),
      }
    );
    var data = await res.json();
    if (!res.ok) throw new Error((data.message) || C.ERROR.REQUEST_FAILED);
    return data.map(C.normalizeProjectRow);
  }

  async function createProject(config, session, payload) {
    if (!isConfigured(config)) throw new Error(C.ERROR.SUPABASE_NOT_CONFIGURED);
    var raw = await rpc(config, 'create_live_project', {
      p_client_name: payload.clientName || '',
      p_channel: payload.channel || 'custom',
      p_invite_label: payload.inviteLabel || '',
    }, session.accessToken);
    return C.normalizeCreatedProject(raw);
  }

  async function fetchClientProjectBundle(config, token) {
    if (!isConfigured(config)) throw new Error(C.ERROR.SUPABASE_NOT_CONFIGURED);
    return rpc(config, 'get_client_project_bundle', { p_token: token });
  }

  global.DDApiSupabase = {
    id: 'supabase',
    isConfigured: isConfigured,
    loginWithPassword: loginWithPassword,
    loginWithWechatQr: loginWithWechatQr,
    fetchCurrentMember: fetchCurrentMember,
    fetchTeamProjects: fetchTeamProjects,
    createProject: createProject,
    fetchClientProjectBundle: fetchClientProjectBundle,
  };
})(window);
