var STORAGE_OPENID = 'dd_client_openid';
var STORAGE_LOCAL_ID = 'dd_client_local_id';

function createLocalId() {
  return 'local-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

function getCachedClientId() {
  return wx.getStorageSync(STORAGE_OPENID) || wx.getStorageSync(STORAGE_LOCAL_ID) || '';
}

function saveClientId(id, isOpenId) {
  if (isOpenId) {
    wx.setStorageSync(STORAGE_OPENID, id);
    return;
  }
  wx.setStorageSync(STORAGE_LOCAL_ID, id);
}

function loginWithCloud() {
  return new Promise(function (resolve, reject) {
    if (!wx.cloud || !wx.cloud.callFunction) {
      reject(new Error('cloud_unavailable'));
      return;
    }

    wx.cloud.callFunction({
      name: 'login',
      success: function (res) {
        var openid = res.result && res.result.openid;
        if (!openid) {
          reject(new Error('no_openid'));
          return;
        }
        saveClientId(openid, true);
        resolve(openid);
      },
      fail: reject
    });
  });
}

function ensureClientId() {
  var cached = getCachedClientId();
  if (cached) {
    return Promise.resolve(cached);
  }

  return loginWithCloud().catch(function () {
    var localId = createLocalId();
    saveClientId(localId, false);
    return localId;
  });
}

module.exports = {
  ensureClientId,
  getCachedClientId
};
