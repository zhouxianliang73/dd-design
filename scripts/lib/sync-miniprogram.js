/**
 * JSON → miniprogram/data/*.js（可被导入脚本复用）
 */
const fs = require('fs');
const path = require('path');

const LITE_FIELDS = [
  'id',
  'name',
  'emoji',
  'space',
  'sub',
  'style',
  'color',
  'spec',
  'material',
  'price',
  'unitPrice',
  'unit',
  'qty',
  'image',
  'channels'
];

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=320&h=180&fit=crop&auto=format&q=80';

function copyDirIfExists(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0;
  fs.mkdirSync(destDir, { recursive: true });
  let count = 0;
  fs.readdirSync(srcDir).forEach(function (name) {
    if (!/\.(jpe?g|png|webp)$/i.test(name)) return;
    fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name));
    count += 1;
  });
  return count;
}

function syncAssetImages(projectRoot) {
  const mpRoot = path.join(projectRoot, 'miniprogram', 'images');
  const pairs = [
    ['images/designers', 'designers'],
    ['images/hardware', 'hardware'],
    ['images/products', 'products']
  ];
  let total = 0;
  pairs.forEach(function (pair) {
    const copied = copyDirIfExists(path.join(projectRoot, pair[0]), path.join(mpRoot, pair[1]));
    if (copied) {
      console.log('copied', copied, 'images → miniprogram/images/' + pair[1]);
    }
    total += copied;
  });
  return total;
}

function resolveHardwareImage(item, projectRoot) {
  return resolveCatalogImage(item, projectRoot, 'hardware');
}

function resolveCatalogImage(item, projectRoot, kind) {
  const id = item.id || '';
  const localJpg = path.join(projectRoot, 'images', kind, id + '.jpg');
  const localPng = path.join(projectRoot, 'images', kind, id + '.png');
  if (fs.existsSync(localJpg)) return '/images/' + kind + '/' + id + '.jpg';
  if (fs.existsSync(localPng)) return '/images/' + kind + '/' + id + '.png';
  if (item.imageLocal && String(item.imageLocal).indexOf('/images/') === 0) {
    const rel = item.imageLocal.replace(/^\//, '');
    if (fs.existsSync(path.join(projectRoot, 'miniprogram', rel))) return item.imageLocal;
  }
  if (item.image && String(item.image).indexOf('http') === 0) return item.image;
  if (item.image && String(item.image).indexOf('/images/') === 0) return item.image;
  return IMAGE_FALLBACK;
}

function resolveDesignerPhoto(designer, projectRoot) {
  const id = designer.id || '';
  const localJpg = path.join(projectRoot, 'images', 'designers', id + '.jpg');
  const localPng = path.join(projectRoot, 'images', 'designers', id + '.png');
  if (fs.existsSync(localJpg)) return '/images/designers/' + id + '.jpg';
  if (fs.existsSync(localPng)) return '/images/designers/' + id + '.png';
  if (designer.photo && String(designer.photo).indexOf('http') === 0) return designer.photo;
  if (designer.photoFallback) return designer.photoFallback;
  return designer.photo || IMAGE_FALLBACK;
}

function syncMiniprogramData(root) {
  const projectRoot = root || path.join(__dirname, '..', '..');
  const dataDir = path.join(projectRoot, 'miniprogram', 'data');
  const files = ['catalog.json', 'channels.json', 'showcase.json', 'designers.json'];

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  syncAssetImages(projectRoot);

  files.forEach(function (name) {
    const jsonPath = path.join(projectRoot, name);
    const outName = name.replace('.json', '.js');
    const outPath = path.join(dataDir, outName);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (name === 'designers.json') {
      const designers = (data.designers || data).map(function (d) {
        return Object.assign({}, d, { photo: resolveDesignerPhoto(d, projectRoot) });
      });
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
    if (item.sub === '功能配件' || (item.quoteSections || []).indexOf('hardware') >= 0) {
      lite.image = resolveHardwareImage(item, projectRoot);
    } else if (item.meta && item.meta.importSource === 'emsun-2026') {
      lite.image = resolveCatalogImage(item, projectRoot, 'products');
    }
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

module.exports = { syncMiniprogramData, resolveHardwareImage, resolveDesignerPhoto };
