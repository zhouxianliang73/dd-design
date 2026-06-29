const clientProject = require('../../utils/client-project-service');
const completedDisplay = require('../../utils/completed-project-display');
const logisticsService = require('../../utils/logistics-service');

Page({
  data: {
    loading: true,
    project: null,
    trackingSyncHint: ''
  },

  onLoad(options) {
    this._id = options.id || options.token || '';
  },

  onShow() {
    this.loadProject();
  },

  loadProject() {
    const that = this;
    const id = this._id;
    clientProject.listMyProjects().then(function (raw) {
      const project = completedDisplay.findCompletedProject(id, raw);
      if (!project) {
        that.setData({ loading: false, project: null });
        wx.showToast({ title: '项目不存在', icon: 'none' });
        return;
      }
      that.setData({
        loading: false,
        project: project,
        trackingSyncHint: project.trackingSyncHint || ''
      });
      wx.setNavigationBarTitle({ title: project.clientName || '项目详情' });
    }).catch(function () {
      const project = completedDisplay.findCompletedProject(id, []);
      that.setData({
        loading: false,
        project: project || null,
        trackingSyncHint: project ? project.trackingSyncHint || '' : ''
      });
      if (project) {
        wx.setNavigationBarTitle({ title: project.clientName || '项目详情' });
      }
    });
  },

  onToggleSection(e) {
    const section = e.currentTarget.dataset.section;
    const project = this.data.project;
    if (!project || !section) return;
    const sectionOpen = Object.assign({}, project.sectionOpen || {});
    sectionOpen[section] = !sectionOpen[section];
    this.setData({
      project: Object.assign({}, project, { sectionOpen: sectionOpen })
    });
  },

  onPay() {
    const payment = this.data.project && this.data.project.payment;
    if (!payment || payment.dueText === '¥0') {
      wx.showToast({ title: '无需付款', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '付款',
      content: '待付 ' + payment.dueText + '（演示）',
      confirmText: '模拟支付',
      success(res) {
        if (res.confirm) wx.showToast({ title: '支付成功（演示）', icon: 'success' });
      }
    });
  },

  onShipInfo() {
    const ship = this.data.project && this.data.project.shipping;
    wx.showModal({
      title: '发货信息',
      content: (ship && ship.summary) || '暂无发货记录',
      showCancel: false
    });
  },

  onTrack() {
    const tracking = (this.data.project && this.data.project.tracking) || [];
    if (!tracking.length) {
      wx.showToast({ title: '暂无物流信息', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '物流跟踪',
      content: tracking.map(function (t) { return t.date + ' ' + t.text; }).join('\n'),
      showCancel: false
    });
  },

  onScanTracking() {
    const that = this;
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['barCode', 'qrCode'],
      success(res) {
        const parsed = logisticsService.parseScanResult(res);
        if (!parsed.trackingNo) {
          wx.showToast({ title: '未识别运单号', icon: 'none' });
          return;
        }
        that.syncTracking(parsed.trackingNo, parsed.carrier);
      },
      fail() {
        wx.showToast({ title: '扫码取消', icon: 'none' });
      }
    });
  },

  onManualSyncTracking() {
    const ship = this.data.project && this.data.project.shipping;
    const no = ship && ship.trackingNo;
    if (!no) {
      wx.showToast({ title: '暂无运单号', icon: 'none' });
      return;
    }
    this.syncTracking(no, ship.carrier);
  },

  syncTracking(trackingNo, carrierHint) {
    const that = this;
    wx.showLoading({ title: '查询物流…', mask: true });
    logisticsService.fetchTracking(trackingNo, carrierHint).then(function (result) {
      wx.hideLoading();
      const project = that.data.project;
      if (!project) return;
      const merged = Object.assign({}, project, {
        tracking: result.tracking,
        trackingSyncHint:
          result.source === 'demo'
            ? '已同步演示轨迹 · 正式环境对接承运商 API 后自动更新'
            : '运单已识别 · 待对接物流 API 自动拉取',
        shipping: Object.assign({}, project.shipping || {}, {
          trackingNo: result.trackingNo,
          carrier: result.carrier,
          summary: result.summary || project.shipping.summary
        })
      });
      that.setData({
        project: merged,
        trackingSyncHint: merged.trackingSyncHint
      });
      wx.showToast({ title: '物流已更新', icon: 'success' });
    }).catch(function () {
      wx.hideLoading();
      wx.showToast({ title: '查询失败', icon: 'none' });
    });
  },

  onPreviewDoc(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.previewImage({ urls: [url], current: url });
  }
});
