let fileConfig = {};

try {
  fileConfig = require('../config/config.js');
} catch (err) {
  console.warn('config/config.js 未找到，使用默认配置', err);
}

const DEFAULTS = {
  brand: 'DD design',
  siteUrl: 'https://dd-design.com',
  imageCdnBase: '',
  defaultChannel: 'custom',
  supabase: { url: '', anonKey: '' }
};

function getConfig() {
  return Object.assign({}, DEFAULTS, fileConfig, {
    supabase: Object.assign({}, DEFAULTS.supabase, fileConfig.supabase || {})
  });
}

module.exports = { getConfig, DEFAULTS };
