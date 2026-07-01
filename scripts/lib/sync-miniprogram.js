/**
 * JSON → miniprogram/data/*.js（可被导入脚本复用）
 */
const fs = require('fs');
const path = require('path');
const {
  loadImageCdnConfig,
  resolveProductImage,
  resolveDesignerImage,
  purgeMiniprogramImages,
} = require('./image-cdn');
const {
  syncHardwareSubPackages,
  updateAppJsonSubPackages,
  clearHardwareSubPackages,
} = require('./image-subpackages');

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

function syncAssetImages(projectRoot, cdnConfig) {
  if (!cdnConfig.copyToMiniprogram) {
    clearHardwareSubPackages(projectRoot);
    const removed = purgeMiniprogramImages(projectRoot);
    if (removed) {
      console.log('CDN 模式：已从小程序包移除', removed, '张本地图片');
    }
    return null;
  }

  clearHardwareSubPackages(projectRoot);

  const mpRoot = path.join(projectRoot, 'miniprogram', 'images');
  const designerCopied = copyDirIfExists(
    path.join(projectRoot, 'images', 'designers'),
    path.join(mpRoot, 'designers')
  );
  if (designerCopied) {
    console.log('copied', designerCopied, 'images → miniprogram/images/designers');
  }

  copyDirIfExists(path.join(projectRoot, 'images', 'products'), path.join(mpRoot, 'products'));

  const subPack =
    cdnConfig.useImageSubPackages !== false
      ? syncHardwareSubPackages(projectRoot, { maxBytes: cdnConfig.maxSubPackageBytes })
      : null;

  if (subPack) {
    updateAppJsonSubPackages(projectRoot, subPack.packCount);
    console.log(
      '五金图分包',
      subPack.packCount,
      '个 ·',
      (subPack.totalBytes / 1024 / 1024).toFixed(2),
      'MB（主包不含五金图）'
    );
    return subPack.map;
  }

  const hwCopied = copyDirIfExists(
    path.join(projectRoot, 'images', 'hardware'),
    path.join(mpRoot, 'hardware')
  );
  if (hwCopied) {
    console.log('copied', hwCopied, 'images → miniprogram/images/hardware');
  }
  return null;
}

function syncPackOptions(projectRoot, cdnConfig) {
  const configPath = path.join(projectRoot, 'project.config.json');
  if (!fs.existsSync(configPath)) return;

  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const excludeImages = cdnConfig.useCdn && !cdnConfig.copyToMiniprogram;
  const ignore = excludeImages ? [{ type: 'folder', value: 'images' }] : [];
  const prev = JSON.stringify(cfg.packOptions && cfg.packOptions.ignore || []);
  const next = JSON.stringify(ignore);

  if (prev !== next) {
    cfg.packOptions = cfg.packOptions || {};
    cfg.packOptions.ignore = ignore;
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
    console.log(excludeImages ? 'packOptions：CDN 模式已忽略 miniprogram/images' : 'packOptions：本地模式已包含 miniprogram/images');
  }
}

function syncMiniprogramData(root) {
  const projectRoot = root || path.join(__dirname, '..', '..');
  const cdnConfig = loadImageCdnConfig(projectRoot);
  const dataDir = path.join(projectRoot, 'miniprogram', 'data');
  const jsonFiles = ['channels.json', 'showcase.json', 'designers.json'];

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (cdnConfig.useCdn) {
    console.log('CDN 模式', cdnConfig.imageCdnBase);
  }

  const imagePackMap = syncAssetImages(projectRoot, cdnConfig);
  syncPackOptions(projectRoot, cdnConfig);

  jsonFiles.forEach(function (name) {
    const jsonPath = path.join(projectRoot, name);
    const outName = name.replace('.json', '.js');
    const outPath = path.join(dataDir, outName);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (name === 'designers.json') {
      const designers = (data.designers || data).map(function (d) {
        return Object.assign({}, d, {
          photo: resolveDesignerImage(d, projectRoot, cdnConfig),
        });
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
      if (imagePackMap && imagePackMap[item.id]) {
        lite.image = imagePackMap[item.id];
      } else {
        lite.image = resolveProductImage(item, projectRoot, 'hardware', cdnConfig);
      }
    } else if (item.meta && item.meta.importSource === 'emsun-2026') {
      lite.image = resolveProductImage(item, projectRoot, 'products', cdnConfig);
    } else if (item.imageLocal && String(item.imageLocal).indexOf('/images/products/') === 0) {
      lite.image = resolveProductImage(item, projectRoot, 'products', cdnConfig);
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

  const staleCatalogJs = path.join(dataDir, 'catalog.js');
  if (fs.existsSync(staleCatalogJs)) {
    fs.unlinkSync(staleCatalogJs);
    console.log('removed unused', staleCatalogJs);
  }
}

module.exports = { syncMiniprogramData };
