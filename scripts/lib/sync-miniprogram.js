/**
 * JSON → miniprogram/data/*.js（可被导入脚本复用）
 */
const fs = require('fs');
const path = require('path');

const LITE_FIELDS = ['id', 'name', 'emoji', 'space', 'sub', 'style', 'color', 'spec', 'material', 'price', 'image', 'channels'];

function syncMiniprogramData(root) {
  const projectRoot = root || path.join(__dirname, '..', '..');
  const dataDir = path.join(projectRoot, 'miniprogram', 'data');
  const files = ['catalog.json', 'channels.json', 'showcase.json', 'designers.json'];

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  files.forEach(function (name) {
    const jsonPath = path.join(projectRoot, name);
    const outName = name.replace('.json', '.js');
    const outPath = path.join(dataDir, outName);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (name === 'designers.json') {
      const designers = data.designers || data;
      fs.writeFileSync(outPath, 'module.exports = ' + JSON.stringify(designers) + ';\n', 'utf8');
    } else {
      fs.writeFileSync(outPath, 'module.exports = ' + JSON.stringify(data) + ';\n', 'utf8');
    }
    console.log('synced', outPath);
  });

  const catalog = JSON.parse(fs.readFileSync(path.join(projectRoot, 'catalog.json'), 'utf8'));
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
}

module.exports = { syncMiniprogramData };
