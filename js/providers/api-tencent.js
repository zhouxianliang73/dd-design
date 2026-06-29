/**
 * 腾讯云 / 微信云开发 · 占位实现
 * 迁移时在此对接云函数 HTTP 网关，保持与 api-supabase.js 相同方法签名。
 *
 * 预期云函数（名称可调整，前端只认契约）：
 *   POST {apiBase}/team/login-password
 *   POST {apiBase}/team/login-wechat-qr
 *   GET  {apiBase}/team/me
 *   GET  {apiBase}/team/projects
 *   POST {apiBase}/team/projects
 *   GET  {apiBase}/client/project-bundle?token=
 */
(function (global) {
  var C = global.DDApiContract;

  function isConfigured(config) {
    var tc = (config && config.tencent) || {};
    return !!(tc.apiBase && tc.apiBase.indexOf('YOUR_') < 0);
  }

  function notReady() {
    return Promise.reject(new Error(C.ERROR.TENCENT_NOT_CONFIGURED));
  }

  async function requestJson(config, path, options) {
    if (!isConfigured(config)) throw new Error(C.ERROR.TENCENT_NOT_CONFIGURED);
    var base = config.tencent.apiBase.replace(/\/$/, '');
    var res = await fetch(base + path, options || {});
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      throw new Error(data.error || data.message || C.ERROR.REQUEST_FAILED);
    }
    return data;
  }

  global.DDApiTencent = {
    id: 'tencent',
    isConfigured: isConfigured,
    loginWithPassword: notReady,
    loginWithWechatQr: notReady,
    fetchCurrentMember: notReady,
    fetchTeamProjects: notReady,
    createProject: notReady,
    fetchClientProjectBundle: notReady,
    /** 迁移完成后在此实现 requestJson 封装 */
    _requestJson: requestJson,
  };
})(window);
