const catalog = require('../../utils/catalog-service');
const favoriteService = require('../../utils/favorite-service');

Page({
  data: {
    keyword: '',
    products: [],
    total: 0
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    this.loadProducts();
  },

  loadProducts() {
    const app = getApp();
    const channelId = app.getChannel();
    const products = catalog.filterProducts(channelId, this.data.keyword, {}).map(function (item) {
      return Object.assign({}, item, {
        isFavorite: favoriteService.isFavorite(item.id)
      });
    });

    this.setData({
      products: products,
      total: products.length
    });
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearchConfirm() {
    this.loadProducts();
  },

  onClearSearch() {
    this.setData({ keyword: '' }, () => this.loadProducts());
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: '/pages/product-detail/product-detail?id=' + id });
  },

  onToggleFavorite(e) {
    const id = e.currentTarget.dataset.id;
    const added = favoriteService.toggle(id);
    const products = this.data.products.map(function (item) {
      if (item.id === id) {
        return Object.assign({}, item, { isFavorite: added });
      }
      return item;
    });

    this.setData({ products });
    wx.showToast({
      title: added ? '已收藏' : '已取消',
      icon: 'none'
    });
  }
});
