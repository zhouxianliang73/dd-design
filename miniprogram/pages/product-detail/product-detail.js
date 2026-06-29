const catalog = require('../../utils/catalog-service');
const favoriteService = require('../../utils/favorite-service');

Page({
  data: {
    product: null,
    isFavorite: false
  },

  onLoad(options) {
    this.productId = options.id;
    this.loadProduct();
  },

  onShow() {
    if (this.productId) {
      this.setData({
        isFavorite: favoriteService.isFavorite(this.productId)
      });
    }
  },

  loadProduct() {
    const product = catalog.getProduct(this.productId);
    if (!product) {
      wx.showToast({ title: '产品不存在', icon: 'none' });
      return;
    }

    wx.setNavigationBarTitle({ title: product.name });
    this.setData({
      product: catalog.decorateProduct(product),
      isFavorite: favoriteService.isFavorite(product.id)
    });
  },

  onToggleFavorite() {
    const added = favoriteService.toggle(this.productId);
    this.setData({ isFavorite: added });
    wx.showToast({
      title: added ? '已加入收藏' : '已取消收藏',
      icon: 'none'
    });
  },

  goProject() {
    wx.switchTab({ url: '/pages/project/project' });
  }
});
