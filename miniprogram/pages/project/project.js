const ddApi = require('../../utils/dd-api');
const clientProject = require('../../utils/client-project-service');
const catalog = require('../../utils/catalog-service');
const favoriteService = require('../../utils/favorite-service');
const projectDisplay = require('../../utils/project-display-service');
const authService = require('../../utils/auth-service');
const { getConfig } = require('../../utils/dd-config');

Page({
  data: {
    loading: true,
    error: '',
    configError: false,
    view: 'list',
    listViewMode: 'list',
    pageTitle: '',
    displayProjects: [],
    favoriteProducts: [],
    favoritesExpanded: true,
    selectAll: false,
    selectedCount: 0,
    selectedTotalText: '¥0',
    canMerge: false,
    mergeBtnLabel: '合并方案',
    mergeHintVisible: false,
    mergeHintMeta: '',
    mergeHintSubs: '',
    showMergeName: false,
    mergeNameInput: '',
    tokenInput: '',
    showBind: false,
    brand: ''
  },

  onLoad(options) {
    if (options && (options.t || options.token)) {
      const raw = options.t || options.token;
      const token = ddApi.parseProjectToken(raw);
      if (token) {
        const app = getApp();
        wx.setStorageSync(app.globalData.storageKeys.projectToken, token);
        this._openToken = token;
      }
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelected();
    }
    this.bootstrap();
  },

  bootstrap() {
    const app = getApp();
    let token = this._openToken || '';

    if (app.globalData.pendingProjectToken) {
      token = app.globalData.pendingProjectToken;
      app.globalData.pendingProjectToken = '';
      wx.setStorageSync(app.globalData.storageKeys.projectToken, token);
    }

    if (token) {
      this._openToken = '';
      this._bindTokenAfterLoad = token;
    }

    this.loadProjectList();
  },

  syncSelection(projects, extra) {
    const stats = projectDisplay.computeSelection(projects);
    const patch = Object.assign(
      {
        displayProjects: projects,
        selectAll: stats.selectAll,
        selectedCount: stats.selectedCount,
        selectedTotalText: stats.selectedTotalText,
        canMerge: stats.canMerge,
        mergeBtnLabel: stats.mergeBtnLabel,
        mergeHintVisible: stats.mergeHintVisible,
        mergeHintMeta: stats.mergeHintMeta,
        mergeHintSubs: stats.mergeHintSubs,
        showMergeName: stats.showMergeName
      },
      extra || {}
    );

    if (stats.showMergeName && !this.data.mergeNameInput) {
      patch.mergeNameInput = stats.suggestedMergeName;
    }
    if (!stats.showMergeName && !stats.canSplit) {
      patch.mergeNameInput = '';
    }

    this.setData(patch);
  },

  loadProjectList() {
    this.setData({ loading: true, error: '', view: 'list', configError: false, listViewMode: 'list' });

    const app = getApp();
    const channelId = app.getChannel();
    const favoriteIds = favoriteService.getIds();
    const favoriteProducts = catalog.getFavoriteProducts(channelId, favoriteIds);
    const config = getConfig();
    const bindToken = this._bindTokenAfterLoad;
    this._bindTokenAfterLoad = '';
    const that = this;

    clientProject
      .listMyProjects()
      .then((projects) => {
        return authService.ensureClientId().then(function (clientId) {
          let displayProjects = projectDisplay.filterSchemeProjects(
            projectDisplay.buildDisplayProjects(projects, clientId)
          );
          if (bindToken) {
            displayProjects = that.ensureTokenProject(displayProjects, bindToken);
          }
          that.setData({
            loading: false,
            favoriteProducts,
            pageTitle: config.brand || 'DD Design Center',
            brand: config.brand,
            error: '',
            mergeNameInput: ''
          });
          that.syncSelection(displayProjects);
        });
      })
      .catch(() => {
        authService.ensureClientId().then(function (clientId) {
          let displayProjects = projectDisplay.buildDisplayProjects([], clientId);
          if (bindToken) {
            displayProjects = that.ensureTokenProject(displayProjects, bindToken);
          }
          that.setData({
            loading: false,
            favoriteProducts,
            pageTitle: config.brand || 'DD Design Center',
            error: ''
          });
          that.syncSelection(displayProjects);
        });
      });
  },

  ensureTokenProject(displayProjects, token) {
    const exists = displayProjects.some(function (p) {
      return p.token === token;
    });
    if (exists) return displayProjects;
    return displayProjects.concat([
      projectDisplay.enrichDisplayProject(
        {
          token: token,
          clientName: '销售绑定项目',
          projectNo: '外部项目',
          status: 'scheme',
          statusLabel: '方案',
          updatedAt: ddApi.formatDate(new Date().toISOString()),
          itemCount: 0,
          selection: []
        },
        displayProjects.length
      )
    ]);
  },

  onToggleViewMode() {
    this.setData({ listViewMode: this.data.listViewMode === 'list' ? 'grid' : 'list' });
  },

  onSelectAllChange(e) {
    const checked = !!e.detail.value.length;
    const projects = projectDisplay.toggleSelectAll(this.data.displayProjects, checked);
    this.syncSelection(projects);
  },

  onToggleSelect(e) {
    const id = e.currentTarget.dataset.id;
    const projects = projectDisplay.toggleSelect(this.data.displayProjects, id);
    this.syncSelection(projects);
  },

  onToggleShell(e) {
    const id = e.currentTarget.dataset.id;
    const projects = projectDisplay.toggleShellExpand(this.data.displayProjects, id);
    this.setData({ displayProjects: projects });
  },

  onToggleSection(e) {
    const id = e.currentTarget.dataset.id;
    const section = e.currentTarget.dataset.section;
    const projects = projectDisplay.toggleSection(this.data.displayProjects, id, section);
    this.setData({ displayProjects: projects });
  },

  onInquirySupplierTap(e) {
    const projectId = e.currentTarget.dataset.projectId;
    const productId = e.currentTarget.dataset.productId;
    const supplierId = e.currentTarget.dataset.supplierId;
    const projects = this.data.displayProjects.map(function (p) {
      if (p.id !== projectId) return p;
      if (!p.procurementAuthorized) return p;
      const procurementProducts = (p.procurementProducts || []).map(function (prod) {
        if (prod.id !== productId) return prod;
        return Object.assign({}, prod, { activeSupplierId: supplierId });
      });
      const sectionOpen = Object.assign({}, p.sectionOpen || {}, {
        procurement: true,
        inquiryQuotes: true,
        inquiryCompare: p.sectionOpen && p.sectionOpen.inquiryCompare
      });
      return Object.assign({}, p, {
        activeProcurementProductId: productId,
        procurementProducts: procurementProducts,
        sectionOpen: sectionOpen
      });
    });
    this.setData({ displayProjects: projects });
  },

  onProcurementProductTap(e) {
    const projectId = e.currentTarget.dataset.projectId;
    const productId = e.currentTarget.dataset.productId;
    const projects = this.data.displayProjects.map(function (p) {
      if (p.id !== projectId) return p;
      return Object.assign({}, p, { activeProcurementProductId: productId });
    });
    this.setData({ displayProjects: projects });
  },

  onDeleteQuoteLine(e) {
    const projectId = e.currentTarget.dataset.projectId;
    const lineId = e.currentTarget.dataset.lineId;
    const lineName = e.currentTarget.dataset.lineName || '该产品';
    const that = this;
    wx.showModal({
      title: '从清单移除',
      content: '确定从方案清单中移除「' + lineName + '」？货运前调整仅限方案内；发货后新增需新建项目。',
      confirmText: '移除',
      success(res) {
        if (!res.confirm) return;
        const projects = projectDisplay.removeQuoteLine(that.data.displayProjects, projectId, lineId);
        that.syncSelection(projects);
        wx.showToast({ title: '已移除', icon: 'none' });
      }
    });
  },

  onConfirmScheme(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name || '方案';
    const projects = projectDisplay.confirmScheme(this.data.displayProjects, id);
    if (!projects) {
      wx.showToast({ title: '未找到方案', icon: 'none' });
      return;
    }
    this.syncSelection(projects, { mergeNameInput: '' });
    wx.showModal({
      title: '方案已确认',
      content: '「' + name + '」已转入「我的」已完成项目，可查看付款、发货与物流跟踪。',
      confirmText: '去我的',
      cancelText: '留在此页',
      success(res) {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/me/me' });
        }
      }
    });
  },

  onGridExpand(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ listViewMode: 'list' }, () => {
      const projects = projectDisplay.toggleShellExpand(this.data.displayProjects, id);
      this.setData({ displayProjects: projects });
    });
  },

  onMergeNameInput(e) {
    this.setData({ mergeNameInput: e.detail.value });
  },

  onMergeProjects() {
    const projects = projectDisplay.mergeSelected(
      this.data.displayProjects,
      this.data.mergeNameInput
    );
    if (!projects) {
      wx.showToast({ title: '请至少勾选 2 个方案', icon: 'none' });
      return;
    }
    const wasSplit = this.data.mergeBtnLabel === '拆分方案';
    this.syncSelection(projects, { mergeNameInput: '' });
    wx.showToast({ title: wasSplit ? '已拆分' : '已合并', icon: 'success' });
  },

  onDeleteSelected() {
    if (!this.data.selectedCount) return;
    const that = this;
    wx.showModal({
      title: '删除方案',
      content: '确定删除已勾选的 ' + this.data.selectedCount + ' 个方案？',
      success(res) {
        if (!res.confirm) return;
        const projects = projectDisplay.deleteSelected(that.data.displayProjects);
        that.syncSelection(projects, { mergeNameInput: '' });
        wx.showToast({ title: '已删除', icon: 'none' });
      }
    });
  },

  onFavoriteTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/product-detail/product-detail?id=' + id });
  },

  onToggleFavorites() {
    this.setData({ favoritesExpanded: !this.data.favoritesExpanded });
  },

  goCreateProject() {
    wx.navigateTo({ url: '/pages/ai-advisor/ai-advisor' });
  },

  onToggleBind() {
    this.setData({ showBind: !this.data.showBind });
  },

  onTokenInput(e) {
    this.setData({ tokenInput: e.detail.value });
  },

  onBindToken() {
    const token = ddApi.parseProjectToken(this.data.tokenInput);
    if (!token) {
      wx.showToast({ title: '请输入口令或链接', icon: 'none' });
      return;
    }
    const app = getApp();
    wx.setStorageSync(app.globalData.storageKeys.projectToken, token);
    this._bindTokenAfterLoad = token;
    this.loadProjectList();
  },

  onReload() {
    this.loadProjectList();
  }
});
