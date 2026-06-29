const channelsData = {
  defaultChannel: 'custom',
  brand: {
    name: 'DD Design Center',
    subtitle: '选品 · 方案 · 跟踪'
  },
  channels: {
    'outdoor-living': {
      label: '户外阳台整体服务',
      catalogSpaces: ['户外家具'],
      heroTag: 'Outdoor Living · 别墅户外阳台',
      heroTitle: '户外阳台整体方案协作',
      heroDesc: '户外厨房、烧烤、凉亭、遮阳统一设计，一站式深化交付。'
    },
    'outdoor-kitchen': {
      label: '户外厨房',
      catalogSpaces: ['户外家具', '不锈钢家具'],
      heroTag: 'Outdoor Kitchen · 岛台 · 烧烤',
      heroTitle: '户外厨房项目协作',
      heroDesc: '从方案选品到清单深化，协助 B 端客户完成户外厨房与岛台项目。'
    },
    'french-ru': {
      label: '法式家具',
      catalogSpaces: ['民用家具', '家具配套'],
      includeFrenchStyle: true,
      heroTag: 'French Furniture · Russia',
      heroTitle: '法式家具项目协作',
      heroDesc: '俄罗斯市场法式定制与选品，设计协助与项目跟踪。'
    },
    'event-ru': {
      label: '活动家具',
      catalogSpaces: ['户外家具', '民用家具', '办公家具'],
      heroTag: 'Event Furniture · Russia',
      heroTitle: '活动家具批量协作',
      heroDesc: '网红活动、批量活动家具快清单与项目跟踪。'
    },
    custom: {
      label: '定制设计',
      catalogSpaces: null,
      heroTag: 'DD Deep Design · 定制深化',
      heroTitle: '从设计到深化的项目协作',
      heroDesc: '定制需求优先：沟通记录、方案版本与清单深化；选品服务于设计方案。'
    }
  }
};

const showcaseData = require('../data/showcase.js');

function getChannels() {
  const map = channelsData.channels || {};
  return Object.keys(map).map(function (key) {
    return Object.assign({ id: key }, map[key]);
  });
}

function getChannel(id) {
  const channels = channelsData.channels || {};
  return channels[id] || channels.custom || {};
}

function getDefaultChannelId() {
  return channelsData.defaultChannel || 'custom';
}

function getBrandMeta() {
  const brandNode = channelsData.brand || {};
  return {
    brand: showcaseData.brand || brandNode.name || 'DD Design Center',
    subtitle: brandNode.subtitle || '选品 · 方案 · 跟踪'
  };
}

function getShowcaseCases() {
  const cases = showcaseData.cases || [];
  return cases.slice().sort(function (a, b) {
    return (a.order || 0) - (b.order || 0);
  });
}

function getShowcaseCase(id) {
  const cases = getShowcaseCases();
  for (let i = 0; i < cases.length; i += 1) {
    if (cases[i].id === id) return cases[i];
  }
  return null;
}

module.exports = {
  getChannels,
  getChannel,
  getDefaultChannelId,
  getBrandMeta,
  getShowcaseCases,
  getShowcaseCase
};
