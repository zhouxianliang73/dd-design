/**
 * 同步 JSON → miniprogram/data/*.js
 *   node scripts/sync-miniprogram-data.js
 */
const path = require('path');
const { syncMiniprogramData } = require('./lib/sync-miniprogram');

syncMiniprogramData(path.join(__dirname, '..'));
