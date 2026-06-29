/**
 * 物流查询（演示 + 扫码解析）。
 * 正式接入需对接承运商 API（顺丰开放平台、快递100、菜鸟等）并配置密钥。
 */

var DEMO_TRACKING = {
  SF1324567890123: {
    carrier: '顺丰速运',
    summary: '已签收',
    tracking: [
      { date: '2026-06-28 14:20', text: '已签收 · 客户确认收货' },
      { date: '2026-06-27 09:10', text: '运输中 · 深圳 → 北京' },
      { date: '2026-06-25 16:00', text: '已发货 · 工厂出库' }
    ]
  },
  SF9988776655443: {
    carrier: '顺丰速运',
    summary: '运输中',
    tracking: [
      { date: '2026-06-25 11:30', text: '运输中 · 主件在途' },
      { date: '2026-06-24 08:00', text: '已发货 · 书房主柜' }
    ]
  },
  SF5566778899001: {
    carrier: '德邦物流',
    summary: '分批签收完成',
    tracking: [
      { date: '2026-06-20 18:00', text: '全部批次签收完成' },
      { date: '2026-06-15 10:20', text: '第二批到货' },
      { date: '2026-06-08 09:00', text: '第一批到货' }
    ]
  }
};

var CARRIER_RULES = [
  { carrier: '顺丰速运', pattern: /^SF/i },
  { carrier: '德邦物流', pattern: /^(DPK|DPL|DB)/i },
  { carrier: '圆通速递', pattern: /^YT/i },
  { carrier: '中通快递', pattern: /^(ZT|75|76)/i }
];

function detectCarrier(trackingNo) {
  var no = String(trackingNo || '').trim();
  for (var i = 0; i < CARRIER_RULES.length; i += 1) {
    if (CARRIER_RULES[i].pattern.test(no)) return CARRIER_RULES[i].carrier;
  }
  return '承运商待识别';
}

function extractTrackingNo(raw) {
  var text = String(raw || '').trim();
  if (!text) return '';
  var sf = text.match(/SF\d{10,}/i);
  if (sf) return sf[0].toUpperCase();
  var digits = text.match(/\b\d{12,20}\b/);
  if (digits) return digits[0];
  return text.replace(/\s/g, '');
}

function parseScanResult(scanResult) {
  var raw = scanResult && scanResult.result ? scanResult.result : scanResult;
  var trackingNo = extractTrackingNo(raw);
  return {
    trackingNo: trackingNo,
    carrier: detectCarrier(trackingNo),
    raw: raw
  };
}

function fetchTracking(trackingNo, carrierHint) {
  var no = extractTrackingNo(trackingNo);
  if (!no) {
    return Promise.reject(new Error('empty_tracking_no'));
  }
  var carrier = carrierHint || detectCarrier(no);
  var demo = DEMO_TRACKING[no];
  if (demo) {
    return Promise.resolve({
      trackingNo: no,
      carrier: demo.carrier || carrier,
      summary: demo.summary,
      tracking: demo.tracking.slice(),
      source: 'demo'
    });
  }
  return Promise.resolve({
    trackingNo: no,
    carrier: carrier,
    summary: '已识别运单，待对接物流 API',
    tracking: [
      {
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        text: '运单 ' + no + ' 已录入 · 正式环境将自动拉取轨迹'
      }
    ],
    source: 'pending_api'
  });
}

module.exports = {
  detectCarrier: detectCarrier,
  extractTrackingNo: extractTrackingNo,
  parseScanResult: parseScanResult,
  fetchTracking: fetchTracking
};
