Component({
  data: {
    selected: 0,
    color: '#9ca3af',
    selectedColor: '#111827',
    backgroundColor: '#ffffff',
    list: [
      { pagePath: '/pages/home/home', text: '首页' },
      { pagePath: '/pages/shop/shop', text: '选品' },
      { pagePath: '/pages/project/project', text: '方案' },
      { pagePath: '/pages/me/me', text: '我的' }
    ]
  },

  methods: {
    syncSelected() {
      const pages = getCurrentPages();
      const route = pages.length ? pages[pages.length - 1].route : '';
      const index = this.data.list.findIndex(function (item) {
        return item.pagePath.replace(/^\//, '') === route;
      });
      if (index >= 0) {
        this.setData({ selected: index });
      }
    },

    onSwitch(e) {
      const path = e.currentTarget.dataset.path;
      const index = Number(e.currentTarget.dataset.index);
      wx.switchTab({ url: path });
      this.setData({ selected: index });
    }
  },

  lifetimes: {
    attached() {
      this.syncSelected();
    }
  }
});
