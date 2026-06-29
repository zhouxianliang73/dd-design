const catalog = require('../../utils/catalog-service');
const favoriteService = require('../../utils/favorite-service');

function withAllOption(list, allLabel) {
  const items = (list || []).map(function (v) {
    return { label: v, value: v };
  });
  return [{ label: allLabel, value: '' }].concat(items);
}

Page({
  data: {
    keyword: '',
    products: [],
    total: 0,
    filters: {
      space: '',
      sub: '',
      style: '',
      color: ''
    },
    spaceOptions: [{ label: '空间', value: '' }],
    subOptions: [{ label: '品类', value: '' }],
    styleOptions: [{ label: '风格', value: '' }],
    colorOptions: [{ label: '颜色', value: '' }],
    spaceIndex: 0,
    subIndex: 0,
    styleIndex: 0,
    colorIndex: 0,
    spaceLabel: '空间',
    subLabel: '品类',
    styleLabel: '风格',
    colorLabel: '颜色'
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    this.syncFilterOptions();
    this.loadProducts();
  },

  syncFilterOptions() {
    const app = getApp();
    const channelId = app.getChannel();
    const opts = catalog.getFilterOptions(channelId, this.data.filters.space);
    const filters = this.data.filters;

    const spaceOptions = withAllOption(opts.spaces, '全部空间');
    const subOptions = withAllOption(opts.subs, '全部品类');
    const styleOptions = withAllOption(opts.styles, '全部风格');
    const colorOptions = withAllOption(opts.colors, '全部颜色');

    this.setData({
      spaceOptions: spaceOptions,
      subOptions: subOptions,
      styleOptions: styleOptions,
      colorOptions: colorOptions,
      spaceIndex: this.findOptionIndex(spaceOptions, filters.space),
      subIndex: this.findOptionIndex(subOptions, filters.sub),
      styleIndex: this.findOptionIndex(styleOptions, filters.style),
      colorIndex: this.findOptionIndex(colorOptions, filters.color),
      spaceLabel: filters.space || '空间',
      subLabel: filters.sub || '品类',
      styleLabel: filters.style || '风格',
      colorLabel: filters.color || '颜色'
    });
  },

  findOptionIndex(options, value) {
    for (let i = 0; i < options.length; i += 1) {
      if (options[i].value === value) return i;
    }
    return 0;
  },

  loadProducts() {
    const app = getApp();
    const channelId = app.getChannel();
    const filters = this.data.filters;
    const products = catalog.filterProducts(channelId, this.data.keyword, filters).map(function (item) {
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
    this.setData({ keyword: '' }, function () {
      this.loadProducts();
    }.bind(this));
  },

  onFilterChange(e) {
    const field = e.currentTarget.dataset.field;
    const index = Number(e.detail.value);
    const key = field + 'Options';
    const options = this.data[key] || [];
    const picked = options[index] || { label: '', value: '' };
    const filters = Object.assign({}, this.data.filters, { [field]: picked.value });

    if (field === 'space') {
      filters.sub = '';
    }

    const labelKey = field + 'Label';
    const labels = {
      spaceLabel: field === 'space' ? (picked.value || '空间') : this.data.spaceLabel,
      subLabel: field === 'sub' ? (picked.value || '品类') : (field === 'space' ? '品类' : this.data.subLabel),
      styleLabel: field === 'style' ? (picked.value || '风格') : this.data.styleLabel,
      colorLabel: field === 'color' ? (picked.value || '颜色') : this.data.colorLabel
    };

    this.setData(Object.assign({
      filters: filters,
      [field + 'Index']: index
    }, labels), function () {
      this.syncFilterOptions();
      this.loadProducts();
    }.bind(this));
  },

  onResetFilters() {
    this.setData({
      filters: { space: '', sub: '', style: '', color: '' },
      spaceLabel: '空间',
      subLabel: '品类',
      styleLabel: '风格',
      colorLabel: '颜色'
    }, function () {
      this.syncFilterOptions();
      this.loadProducts();
    }.bind(this));
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

    this.setData({ products: products });
    wx.showToast({
      title: added ? '已收藏' : '已取消',
      icon: 'none'
    });
  }
});
