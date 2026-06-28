const catalog = require('../../utils/catalog-service');

const channelService = require('../../utils/channel-service');

const favoriteService = require('../../utils/favorite-service');



var NARROW_WIDTH = 420;



Page({

  data: {

    channelLabel: '',

    keyword: '',

    products: [],

    total: 0,

    filterSpace: '',

    filterSub: '',

    filterStyle: '',

    filterColor: '',

    spaceOptions: [],

    subOptions: [],

    styleOptions: [],

    colorOptions: [],

    hasActiveFilters: false,

    activeFilterTags: [],

    narrowScreen: true,

    filterSpaceLabels: ['全部'],

    filterSubLabels: ['全部'],

    filterStyleLabels: ['全部'],

    filterColorLabels: ['全部'],

    filterSpaceIndex: 0,

    filterSubIndex: 0,

    filterStyleIndex: 0,

    filterColorIndex: 0,

    filterSubEnabled: false

  },



  onLoad() {

    this.detectScreen();

  },



  onShow() {

    const that = this;

    this.detectScreen();

    setTimeout(function () {

      that.loadProducts();

    }, 50);

  },



  detectScreen() {

    try {

      var info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();

      var narrow = (info.windowWidth || 375) <= NARROW_WIDTH;

      if (narrow !== this.data.narrowScreen) {

        this.setData({ narrowScreen: narrow });

      }

    } catch (e) {

      this.setData({ narrowScreen: true });

    }

  },



  buildPickerLabels(options, current) {

    var labels = ['全部'].concat(options || []);

    var index = 0;

    if (current) {

      var found = labels.indexOf(current);

      index = found >= 0 ? found : 0;

    }

    return { labels: labels, index: index };

  },



  loadProducts() {

    const app = getApp();

    const channelId = app.getChannel();

    const channel = channelService.getChannel(channelId);

    const filters = {

      space: this.data.filterSpace,

      sub: this.data.filterSub,

      style: this.data.filterStyle,

      color: this.data.filterColor

    };

    const options = catalog.getFilterOptions(channelId, filters.space);

    const products = catalog.filterProducts(channelId, this.data.keyword, filters).map(function (item) {

      return Object.assign({}, item, {

        priceText: catalog.formatPrice(item.price),

        isFavorite: favoriteService.isFavorite(item.id)

      });

    });



    const activeFilterTags = [];

    if (filters.space) activeFilterTags.push({ key: 'space', label: filters.space });

    if (filters.sub) activeFilterTags.push({ key: 'sub', label: filters.sub });

    if (filters.style) activeFilterTags.push({ key: 'style', label: filters.style });

    if (filters.color) activeFilterTags.push({ key: 'color', label: filters.color });



    var spacePick = this.buildPickerLabels(options.spaces, filters.space);

    var subPick = this.buildPickerLabels(
      filters.space && options.subs.length ? options.subs : [],
      filters.sub
    );
    if (!filters.space || !options.subs.length) {
      subPick = { labels: ['全部'], index: 0 };
    }

    var stylePick = this.buildPickerLabels(options.styles, filters.style);

    var colorPick = this.buildPickerLabels(options.colors, filters.color);



    this.setData({

      channelLabel: channel.label || channelId,

      spaceOptions: options.spaces,

      subOptions: options.subs,

      styleOptions: options.styles,

      colorOptions: options.colors,

      products,

      total: products.length,

      hasActiveFilters: activeFilterTags.length > 0,

      activeFilterTags,

      filterSpaceLabels: spacePick.labels,

      filterSubLabels: subPick.labels,

      filterStyleLabels: stylePick.labels,

      filterColorLabels: colorPick.labels,

      filterSpaceIndex: spacePick.index,

      filterSubIndex: subPick.index,

      filterStyleIndex: stylePick.index,

      filterColorIndex: colorPick.index,

      filterSubEnabled: filters.space && options.subs.length > 0

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



  onFilterSpace(e) {

    const value = e.currentTarget.dataset.value || '';

    this.setData({

      filterSpace: value,

      filterSub: ''

    }, () => this.loadProducts());

  },



  onFilterSub(e) {

    const value = e.currentTarget.dataset.value || '';

    this.setData({ filterSub: value }, () => this.loadProducts());

  },



  onFilterStyle(e) {

    const value = e.currentTarget.dataset.value || '';

    this.setData({ filterStyle: value }, () => this.loadProducts());

  },



  onFilterColor(e) {

    const value = e.currentTarget.dataset.value || '';

    this.setData({ filterColor: value }, () => this.loadProducts());

  },



  onPickSpace(e) {

    var labels = this.data.filterSpaceLabels;

    var idx = Number(e.detail.value) || 0;

    var value = idx === 0 ? '' : labels[idx] || '';

    this.setData({ filterSpace: value, filterSub: '' }, () => this.loadProducts());

  },



  onPickSub(e) {

    if (!this.data.filterSubEnabled) return;

    var labels = this.data.filterSubLabels;

    var idx = Number(e.detail.value) || 0;

    var value = idx === 0 ? '' : labels[idx] || '';

    this.setData({ filterSub: value }, () => this.loadProducts());

  },



  onPickStyle(e) {

    var labels = this.data.filterStyleLabels;

    var idx = Number(e.detail.value) || 0;

    var value = idx === 0 ? '' : labels[idx] || '';

    this.setData({ filterStyle: value }, () => this.loadProducts());

  },



  onPickColor(e) {

    var labels = this.data.filterColorLabels;

    var idx = Number(e.detail.value) || 0;

    var value = idx === 0 ? '' : labels[idx] || '';

    this.setData({ filterColor: value }, () => this.loadProducts());

  },



  onClearFilters() {

    this.setData({

      filterSpace: '',

      filterSub: '',

      filterStyle: '',

      filterColor: ''

    }, () => this.loadProducts());

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

      title: added ? '已加入收藏' : '已取消收藏',

      icon: 'none'

    });

  }

});

