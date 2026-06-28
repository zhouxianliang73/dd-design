var authService = require('./auth-service');
var ddApi = require('./dd-api');
var { getConfig } = require('./dd-config');

var LOCAL_KEY = 'dd_my_projects';

function readLocalProjects() {
  try {
    var list = wx.getStorageSync(LOCAL_KEY);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function writeLocalProjects(list) {
  wx.setStorageSync(LOCAL_KEY, list || []);
}

function saveLocalProject(project) {
  var list = readLocalProjects();
  list.unshift(project);
  writeLocalProjects(list);
  return project;
}

function buildLocalProject(clientId, payload) {
  var now = new Date().toISOString();
  var token = 'local-' + clientId + '-' + Date.now();
  return {
    id: token,
    project_no: '本地-' + ddApi.formatDate(now).replace(/-/g, ''),
    access_token: token,
    client_name: payload.clientName || '我的项目',
    channel: payload.channel || 'custom',
    status: 'inquiry',
    selection: payload.selection || [],
    updated_at: now,
    _local: true,
    comm_summary: { clientBrief: payload.brief || '' },
    meta: Object.assign({}, payload.meta || {}, { brief: payload.brief || '' })
  };
}

function createInquiry(payload) {
  return authService.ensureClientId().then(function (clientId) {
    var config = getConfig();
    var body = {
      p_openid: clientId,
      p_channel: payload.channel || 'custom',
      p_brief: payload.brief || '',
      p_selection: payload.selection || [],
      p_meta: Object.assign({}, payload.meta || {}, {
        clientName: payload.clientName || '我的项目',
        address: payload.address || '',
        expectDate: payload.expectDate || ''
      })
    };

    return ddApi
      .createClientInquiry(config, body)
      .then(function (project) {
        saveLocalProject(Object.assign({}, project, { _local: false }));
        return project;
      })
      .catch(function (err) {
        if (err.message !== 'supabase_not_configured') {
          console.warn('createInquiry remote failed, use local', err);
        }
        var localProject = buildLocalProject(clientId, payload);
        saveLocalProject(localProject);
        return localProject;
      });
  });
}

function listMyProjects() {
  return authService.ensureClientId().then(function (clientId) {
    var config = getConfig();

    return ddApi
      .listClientProjects(config, clientId)
      .then(function (remoteList) {
        var list = Array.isArray(remoteList) ? remoteList : [];
        var remoteTokens = {};
        list.forEach(function (item) {
          remoteTokens[item.access_token] = true;
        });
        var locals = readLocalProjects().filter(function (item) {
          return item._local && !remoteTokens[item.access_token];
        });
        var merged = list.concat(locals);
        writeLocalProjects(merged);
        return merged.map(formatProjectSummary);
      })
      .catch(function (err) {
        if (err.message !== 'supabase_not_configured') {
          console.warn('listMyProjects remote failed, use local', err);
        }
        return readLocalProjects().map(formatProjectSummary);
      });
  });
}

function formatProjectSummary(item) {
  var selection = item.selection || [];
  return {
    id: item.id,
    token: item.access_token,
    projectNo: item.project_no || '',
    clientName: item.client_name || '我的项目',
    status: item.status || 'inquiry',
    statusLabel: ddApi.statusLabel(item.status || 'inquiry'),
    updatedAt: ddApi.formatDate(item.updated_at),
    itemCount: selection.length,
    selection: selection
  };
}

function loadProjectDetail(token) {
  if (token && String(token).indexOf('local-') === 0) {
    var list = readLocalProjects();
    var found = null;
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].access_token === token) {
        found = list[i];
        break;
      }
    }
    if (!found) {
      return Promise.reject(new Error('not_found'));
    }
    var brief = (found.meta && found.meta.brief) || (found.comm_summary && found.comm_summary.clientBrief) || '';
    return Promise.resolve({
      project: found,
      messages: brief
        ? [
            {
              sender_role: 'client',
              body: brief,
              created_at: found.updated_at
            }
          ]
        : []
    });
  }

  return ddApi.fetchClientProject(getConfig(), token);
}

function selectionFromProducts(products) {
  return (products || []).map(function (item) {
    return {
      catalogId: item.id,
      name: item.name,
      qty: 1,
      unit: '件'
    };
  });
}

module.exports = {
  createInquiry,
  listMyProjects,
  loadProjectDetail,
  selectionFromProducts
};
