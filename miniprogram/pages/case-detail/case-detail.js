const channelService = require('../../utils/channel-service');

Page({
  data: {
    caseItem: null
  },

  onLoad(options) {
    const caseItem = channelService.getShowcaseCase(options.id);
    if (!caseItem) {
      wx.showToast({ title: '案例不存在', icon: 'none' });
      return;
    }

    wx.setNavigationBarTitle({ title: caseItem.title });
    this.setData({ caseItem });
  },

  goShop() {
    const channel = this.data.caseItem && this.data.caseItem.channel;
    if (channel) getApp().setChannel(channel);
    wx.switchTab({ url: '/pages/shop/shop' });
  }
});
