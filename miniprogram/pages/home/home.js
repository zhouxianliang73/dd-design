var channelService = require('../../utils/channel-service');
var catalog = require('../../utils/catalog-service');
var favoriteService = require('../../utils/favorite-service');
var designers = require('../../data/designers.js');

Page({
  data: {
    heroTag: '',
    heroTitle: '',
    heroDesc: '',
    designers: [],
    cases: [],
    recommendProducts: []
  },

  onShow: function () {
    this.loadPage();
  },

  loadPage: function () {
    var app = getApp();
    var channelId = app.getChannel();
    var channel = channelService.getChannel(channelId);
    var favoriteIds = favoriteService.getIds();
    var recommendProducts = catalog.getHomeRecommendProducts(channelId, favoriteIds, 6);

    this.setData({
      heroTag: channel.heroTag || 'DD Design Center',
      heroTitle: channel.heroTitle || '从设计到深化的项目协作',
      heroDesc: channel.heroDesc || '选品、方案清单与项目跟踪，一站完成。',
      designers: designers,
      cases: channelService.getShowcaseCases(),
      recommendProducts: recommendProducts
    });
  },

  onCaseTap: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/case-detail/case-detail?id=' + id });
  },

  onProductTap: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/product-detail/product-detail?id=' + id });
  },

  goShop: function () {
    wx.switchTab({ url: '/pages/shop/shop' });
  },

  goProject: function () {
    wx.switchTab({ url: '/pages/project/project' });
  },

  goAiAdvisor: function () {
    wx.navigateTo({ url: '/pages/ai-advisor/ai-advisor' });
  },

  onDesignerTap: function () {
    wx.showToast({ title: '提交需求后将为您匹配设计师', icon: 'none' });
    wx.navigateTo({ url: '/pages/ai-advisor/ai-advisor' });
  }
});
