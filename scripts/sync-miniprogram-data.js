/**
 * 同步 JSON → miniprogram/data/*.js
 *   node scripts/sync-miniprogram-data.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'miniprogram', 'data');
const files = ['catalog.json', 'channels.json', 'showcase.json'];
const LITE_FIELDS = ['id', 'name', 'emoji', 'space', 'sub', 'style', 'color', 'spec', 'material', 'price', 'image', 'channels'];

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

files.forEach(function (name) {
  const jsonPath = path.join(root, name);
  const outPath = path.join(dataDir, name.replace('.json', '.js'));
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  fs.writeFileSync(outPath, 'module.exports = ' + JSON.stringify(data) + ';\n', 'utf8');
  console.log('synced', outPath);
});

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
const liteProducts = (catalog.products || []).map(function (item) {
  const lite = {};
  LITE_FIELDS.forEach(function (key) {
    if (item[key] != null) lite[key] = item[key];
  });
  return lite;
});
const litePath = path.join(dataDir, 'catalog-lite.js');
fs.writeFileSync(
  litePath,
  'module.exports = ' + JSON.stringify({ version: catalog.version, products: liteProducts }) + ';\n',
  'utf8'
);
console.log('synced', litePath);
