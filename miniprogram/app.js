App({
  onLaunch: function (options) {
    this.applyLaunchQuery(options);
    var channel = wx.getStorageSync('dd_channel') || 'custom';
    this.globalData.channel = channel;

    if (wx.cloud) {
      try {
        wx.cloud.init({ traceUser: true });
      } catch (e) {
        console.warn('cloud init skipped', e);
      }
    }

    var authService = require('./utils/auth-service');
    authService.ensureClientId().catch(function () {});
  },

  onShow: function (options) {
    this.applyLaunchQuery(options);
  },

  applyLaunchQuery: function (options) {
    if (!options || !options.query) return;
    var token = options.query.t || options.query.token;
    if (!token) return;

    var ddApi = require('./utils/dd-api');
    var parsed = ddApi.parseProjectToken(token);
    if (!parsed) return;

    wx.setStorageSync(this.globalData.storageKeys.projectToken, parsed);
    this.globalData.pendingProjectToken = parsed;
  },

  setChannel: function (channelId) {
    this.globalData.channel = channelId;
    wx.setStorageSync('dd_channel', channelId);
  },

  getChannel: function () {
    return this.globalData.channel;
  },

  globalData: {
    channel: 'custom',
    pendingProjectToken: '',
    storageKeys: {
      channel: 'dd_channel',
      projectToken: 'dd_project_token'
    }
  }
});
