const STATUS_LABELS = {
  inquiry: '询价',
  scheme: '方案',
  quoted: '报价',
  ordered: '下单',
  production: '生产',
  shipped: '发货'
};

function supabaseHeaders(anonKey, extra) {
  const headers = {
    apikey: anonKey,
    Authorization: 'Bearer ' + anonKey,
    'Content-Type': 'application/json'
  };
  if (extra) {
    Object.keys(extra).forEach(function (key) {
      headers[key] = extra[key];
    });
  }
  return headers;
}

function request(options) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: options.url,
      method: options.method || 'GET',
      header: options.header,
      data: options.data,
      success: function (res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        const data = res.data || {};
        const msg = data.message || data.error || data.error_description || 'request_failed';
        reject(new Error(msg));
      },
      fail: function (err) {
        reject(new Error(err.errMsg || 'network_error'));
      }
    });
  });
}

function ensureSupabase(config) {
  const supabase = config.supabase || {};
  const url = supabase.url;
  const anonKey = supabase.anonKey;
  if (!url || !anonKey || url.indexOf('YOUR_PROJECT') >= 0) {
    throw new Error('supabase_not_configured');
  }
  return { url: url, anonKey: anonKey };
}

function rpc(config, fnName, body) {
  const cred = ensureSupabase(config);
  return request({
    url: cred.url + '/rest/v1/rpc/' + fnName,
    method: 'POST',
    header: supabaseHeaders(cred.anonKey),
    data: body || {}
  });
}

function fetchClientProject(config, token) {
  if (token && String(token).indexOf('local-') === 0) {
    return Promise.reject(new Error('local_project_only'));
  }
  return rpc(config, 'get_client_project_bundle', { p_token: token });
}

function createClientInquiry(config, body) {
  return rpc(config, 'create_client_inquiry', body);
}

function listClientProjects(config, openid) {
  return rpc(config, 'list_client_projects', { p_openid: openid });
}

function statusLabel(code) {
  return STATUS_LABELS[code] || code;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const pad = function (n) {
    return String(n).padStart(2, '0');
  };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

/**
 * 从口令或完整项目链接中提取 access_token
 * 支持：纯口令、p.html?t=、任意 URL 带 t=、/p/TOKEN 路径
 */
function parseProjectToken(input) {
  const raw = (input || '').trim();
  if (!raw) return '';

  const tMatch = raw.match(/[?&]t=([^&#]+)/i);
  if (tMatch && tMatch[1]) {
    return decodeURIComponent(tMatch[1]).trim();
  }

  const pathMatch = raw.match(/\/p\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1].trim();
  }

  return raw;
}

function buildMagicLink(config, token) {
  const base = (config.siteUrl || '').replace(/\/$/, '');
  if (!base) return 'p.html?t=' + encodeURIComponent(token);
  return base + '/p.html?t=' + encodeURIComponent(token);
}

module.exports = {
  STATUS_LABELS: STATUS_LABELS,
  rpc: rpc,
  fetchClientProject: fetchClientProject,
  createClientInquiry: createClientInquiry,
  listClientProjects: listClientProjects,
  parseProjectToken: parseProjectToken,
  buildMagicLink: buildMagicLink,
  statusLabel: statusLabel,
  formatDate: formatDate
};
