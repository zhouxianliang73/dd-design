const channelService = require('../../utils/channel-service');
const catalog = require('../../utils/catalog-service');
const favoriteService = require('../../utils/favorite-service');
const clientProject = require('../../utils/client-project-service');
const completedDisplay = require('../../utils/completed-project-display');
const { getConfig } = require('../../utils/dd-config');

var BENEFITS = [
  {
    title: '设计费 8 折',
    sub: '已完成 2 个项目解锁 · 长期有效'
  },
  {
    title: '¥500 优惠券',
    sub: '满 ¥20,000 可用 · 7 天后到期'
  },
  {
    title: '免运费 1 次',
    sub: '全国范围 · 有效期 30 天'
  }
];

Page({
  data: {
    brand: '',
    displayName: '微信客户',
    memberLabel: '金牌会员',
    profileEmail: '',
    completedCount: 0,
    ratingText: '4.8',
    benefits: BENEFITS,
    completedProjects: [],
    favoriteProducts: [],
    favoritesExpanded: true,
    channels: [],
    currentChannelLabel: '',
    filingNo: '粤ICP备2026001662号-1X',
    siteDomain: 'dd-design.com',
    footerBrand: 'DD Design Center · 选品中心'
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    this.loadPage();
  },

  loadPage() {
    const app = getApp();
    const config = getConfig();
    const channelId = app.getChannel();
    const channel = channelService.getChannel(channelId);
    const favoriteIds = favoriteService.getIds();
    const favoriteProducts = catalog.getFavoriteProducts(channelId, favoriteIds);
    const channels = channelService.getChannels().map(function (item) {
      return { id: item.id, label: item.label || item.id };
    });

    const that = this;
    clientProject.listMyProjects().then(function (rawList) {
      const completedProjects = completedDisplay.buildCompletedProjects(rawList);
      that.setData({
        brand: config.brand,
        footerBrand: (config.brand || 'DD Design Center') + ' · 选品中心',
        displayName: completedProjects.length ? '我的设计档案' : '微信客户',
        profileEmail: '小程序客户 · 国内服务',
        completedCount: completedProjects.length,
        ratingText: '4.8',
        completedProjects: completedProjects,
        favoriteProducts: favoriteProducts,
        channels: channels,
        currentChannelLabel: channel.label || channelId,
        siteDomain: (config.siteUrl || 'https://dd-design.com').replace(/^https?:\/\//, '')
      });
    }).catch(function () {
      const completedProjects = completedDisplay.buildCompletedProjects([]);
      that.setData({
        brand: config.brand,
        footerBrand: (config.brand || 'DD Design Center') + ' · 选品中心',
        completedProjects: completedProjects,
        completedCount: completedProjects.length,
        favoriteProducts: favoriteProducts,
        channels: channels,
        currentChannelLabel: channel.label || channelId,
        siteDomain: (config.siteUrl || 'https://dd-design.com').replace(/^https?:\/\//, '')
      });
    });
  },

  onToggleFavorites() {
    this.setData({ favoritesExpanded: !this.data.favoritesExpanded });
  },

  onFavoriteTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/product-detail/product-detail?id=' + id });
  },

  onCompletedTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/my-project/my-project?id=' + id });
  },

  onSettingTap(e) {
    const key = e.currentTarget.dataset.key;
    const map = {
      settings: '设置功能即将开放',
      language: '当前：简体中文',
      theme: '深色模式即将开放',
      privacy: '隐私与安全说明即将开放',
      channel: '请在下方选择渠道'
    };
    wx.showToast({ title: map[key] || '即将开放', icon: 'none' });
  },

  onChannelChange(e) {
    const channelId = this.data.channels[e.detail.value].id;
    getApp().setChannel(channelId);
    this.loadPage();
    wx.showToast({ title: '渠道已切换', icon: 'success' });
  },

  goProject() {
    wx.switchTab({ url: '/pages/project/project' });
  },

  goCreateProject() {
    wx.navigateTo({ url: '/pages/ai-advisor/ai-advisor' });
  }
});
