var aiAdvisor = require('../../utils/ai-advisor');
var clientProject = require('../../utils/client-project-service');

Page({
  data: {
    userNote: '',
    projectAddress: '',
    expectDate: '',
    imagePaths: [],
    analyzing: false,
    hasResult: false,
    summary: '',
    keywords: [],
    products: [],
    modeLabel: '',
    projectCreated: false,
    suggestTags: ['北欧风格', '实木家具', '客厅设计', '户外厨房', '现代简约']
  },

  onNoteInput: function (e) {
    this.setData({ userNote: e.detail.value });
  },

  onAddressInput: function (e) {
    this.setData({ projectAddress: e.detail.value });
  },

  onDateChange: function (e) {
    this.setData({ expectDate: e.detail.value });
  },

  onSuggestTap: function (e) {
    var tag = e.currentTarget.dataset.tag;
    var note = this.data.userNote || '';
    if (note.indexOf(tag) >= 0) return;
    var next = note ? note + '，' + tag : tag;
    this.setData({ userNote: next });
  },

  onChooseCamera: function () {
    this.pickImages(['camera']);
  },

  onChooseAlbum: function () {
    this.pickImages(['album']);
  },

  onUploadZoneTap: function () {
    this.pickImages(['album', 'camera']);
  },

  pickImages: function (sourceType) {
    var that = this;
    aiAdvisor
      .chooseReferenceImages(sourceType, that.data.imagePaths.length)
      .then(function (paths) {
        var merged = that.data.imagePaths.concat(paths).slice(0, 9);
        that.setData({
          imagePaths: merged,
          hasResult: false,
          summary: '',
          keywords: [],
          products: [],
          projectCreated: false
        });
      })
      .catch(function (err) {
        if (err && err.message === 'max_images') {
          wx.showToast({ title: '最多 9 张参考图', icon: 'none' });
          return;
        }
        wx.showToast({ title: '未选择图片', icon: 'none' });
      });
  },

  onRemoveImage: function (e) {
    var index = e.currentTarget.dataset.index;
    var list = this.data.imagePaths.slice();
    list.splice(index, 1);
    this.setData({ imagePaths: list });
  },

  onSubmit: function () {
    var that = this;
    var note = (that.data.userNote || '').trim();
    var images = that.data.imagePaths || [];

    if (!note && !images.length) {
      wx.showToast({ title: '请描述想法或上传参考图', icon: 'none' });
      return;
    }

    var brief = aiAdvisor.buildClientBrief({
      userNote: note,
      projectAddress: that.data.projectAddress,
      expectDate: that.data.expectDate,
      imageCount: images.length
    });

    var channelId = getApp().getChannel();
    var primaryImage = images.length ? images[0] : '';

    that.setData({ analyzing: true, projectCreated: false });

    var analyzePromise = primaryImage
      ? aiAdvisor.analyzeReferenceImage(primaryImage, brief, channelId)
      : Promise.resolve(aiAdvisor.analyzeLocal(brief, channelId));

    analyzePromise
      .then(function (result) {
        var modeLabel = '智能匹配';
        if (result.mode === 'openai_vision') modeLabel = 'AI 识图';
        else if (result.mode === 'cloud' || result.mode === 'cloud_local') modeLabel = '云分析';

        that.setData({
          analyzing: false,
          hasResult: true,
          summary: result.summary,
          keywords: result.keywords || [],
          products: result.products || [],
          modeLabel: modeLabel
        });

        var clientName = that.data.projectAddress
          ? '项目 · ' + that.data.projectAddress.slice(0, 16)
          : '我的设计需求';

        return clientProject
          .createInquiry({
            channel: channelId,
            brief: brief,
            clientName: clientName,
            address: that.data.projectAddress,
            expectDate: that.data.expectDate,
            selection: clientProject.selectionFromProducts(result.products),
            meta: {
              brief: brief,
              summary: result.summary,
              keywords: result.keywords || [],
              imageCount: images.length
            }
          })
          .then(function (project) {
            that.setData({ projectCreated: true });
            var app = getApp();
            wx.setStorageSync(app.globalData.storageKeys.projectToken, project.access_token);
            wx.showToast({ title: '项目已创建', icon: 'success' });
          })
          .catch(function () {
            wx.showToast({ title: '推荐已生成，项目稍后同步', icon: 'none' });
          });
      })
      .catch(function () {
        that.setData({ analyzing: false });
        wx.showToast({ title: '分析失败，请重试', icon: 'none' });
      });
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
  }
});
