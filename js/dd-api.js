/**
 * DD design · 平台 API 门面
 * 页面只依赖 DDApi；切换 Supabase / 腾讯云改 config.public.json 的 apiProvider。
 */
(function (global) {
  var C = global.DDApiContract;

  function resolveProvider(config) {
    var name = (config && config.apiProvider) || 'supabase';
    if (name === 'tencent') return global.DDApiTencent;
    return global.DDApiSupabase;
  }

  function getProvider(config) {
    var provider = resolveProvider(config);
    if (!provider || !provider.isConfigured(config)) {
      if ((config && config.apiProvider) === 'tencent') {
        throw new Error(C.ERROR.TENCENT_NOT_CONFIGURED);
      }
      throw new Error(C.ERROR.SUPABASE_NOT_CONFIGURED);
    }
    return provider;
  }

  function parseMagicToken() {
    var q = new URLSearchParams(location.search);
    if (q.get('t')) return q.get('t');
    var m = location.pathname.match(/\/p\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : '';
  }

  function buildMagicLink(config, token) {
    var base = (config.siteUrl || '').replace(/\/$/, '') || location.origin;
    return base + '/' + (config.magicLinkPath || 'p.html') + '?t=' + encodeURIComponent(token);
  }

  var auth = {
    loginWithPassword: async function (config, email, password) {
      return resolveProvider(config).loginWithPassword(config, email, password);
    },
    loginWithWechatQr: async function (config) {
      return resolveProvider(config).loginWithWechatQr(config);
    },
    normalizeSession: function (raw, provider) {
      return C.normalizeSession(raw, provider);
    },
  };

  var team = {
    fetchCurrentMember: async function (config, session) {
      return getProvider(config).fetchCurrentMember(config, session);
    },
    fetchProjects: async function (config, session) {
      return getProvider(config).fetchTeamProjects(config, session);
    },
    createProject: async function (config, session, payload) {
      return getProvider(config).createProject(config, session, payload);
    },
    hasCapability: function (role, cap) {
      return C.hasCapability(role, cap);
    },
  };

  var client = {
    fetchProjectBundle: async function (config, token) {
      return getProvider(config).fetchClientProjectBundle(config, token);
    },
  };

  global.DDApi = {
    CONTRACT_VERSION: C.CONTRACT_VERSION,
    ERROR: C.ERROR,
    STATUS_LABELS: C.STATUS_LABELS,
    auth: auth,
    team: team,
    client: client,
    parseMagicToken: parseMagicToken,
    buildMagicLink: buildMagicLink,
    statusLabel: C.statusLabel,
    getProviderName: function (config) {
      return (config && config.apiProvider) || 'supabase';
    },

    /** @deprecated 使用 DDApi.auth.loginWithPassword */
    authPassword: function (config, email, password) {
      return auth.loginWithPassword(config, email, password);
    },
    /** @deprecated 使用 DDApi.client.fetchProjectBundle */
    fetchClientProject: function (config, token) {
      return client.fetchProjectBundle(config, token);
    },
    /** @deprecated 使用 DDApi.team.fetchProjects */
    fetchTeamProjects: function (config, accessToken) {
      return team.fetchProjects(config, { accessToken: accessToken });
    },
    /** @deprecated 使用 DDApi.team.createProject */
    createProject: function (config, accessToken, payload) {
      return team.createProject(config, { accessToken: accessToken }, payload);
    },
    /** @deprecated 内部 rpc，迁移后勿在新代码中使用 */
    rpc: function (config, fnName, body) {
      if (!global.DDApiSupabase || !global.DDApiSupabase.isConfigured(config)) {
        return Promise.reject(new Error(C.ERROR.SUPABASE_NOT_CONFIGURED));
      }
      var sb = config.supabase;
      return fetch(sb.url + '/rest/v1/rpc/' + fnName, {
        method: 'POST',
        headers: {
          apikey: sb.anonKey,
          Authorization: 'Bearer ' + sb.anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body || {}),
      }).then(function (res) {
        return res.text().then(function (text) {
          var data = text ? JSON.parse(text) : null;
          if (!res.ok) throw new Error((data && data.message) || C.ERROR.REQUEST_FAILED);
          return data;
        });
      });
    },
  };
})(window);
