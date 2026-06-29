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
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    this.loadPage();
  },

  loadPage: function () {
    var app = getApp();
    var channelId = app.getChannel();
    var channel = channelService.getChannel(channelId);
    var favoriteIds = favoriteService.getIds();
    var recommendProducts = catalog.getHomeRecommendProducts(channelId, favoriteIds, 6).map(function (item) {
      return Object.assign({}, item, {
        isFavorite: favoriteService.isFavorite(item.id)
      });
    });

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

  onToggleFavorite: function (e) {
    var id = e.currentTarget.dataset.id;
    var added = favoriteService.toggle(id);
    var list = this.data.recommendProducts.map(function (item) {
      if (item.id === id) {
        return Object.assign({}, item, { isFavorite: added });
      }
      return item;
    });
    this.setData({ recommendProducts: list });
    wx.showToast({ title: added ? '已收藏' : '已取消', icon: 'none' });
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
    wx.navigateTo({ url: '/pages/ai-advisor/ai-advisor' });
  }
});
