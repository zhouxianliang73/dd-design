/**
 * 从五金价目表批量导出嵌入图例 → images/hardware/
 *   npm run content:extract-hardware-images
 *   node scripts/extract-hardware-images.js "c:/path/五金.xlsx"
 */
const fs = require('fs');
const path = require('path');
const { syncMiniprogramData } = require('./lib/sync-miniprogram');
const { exportHardwareImagesFromXlsx } = require('./lib/extract-wps-dispimg-images');

const root = path.join(__dirname, '..');
const inputPath = process.argv[2] || 'c:/Users/LocalAccount/Desktop/五金.xlsx';
const catalogPath = path.join(root, 'catalog.json');

if (!fs.existsSync(inputPath)) {
  console.error('文件不存在：' + inputPath);
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const products = catalog.products || [];

console.log('导出嵌入图例', inputPath);

const result = exportHardwareImagesFromXlsx(inputPath, {
  projectRoot: root,
  products: products,
  updateCatalog: true,
});

if (result.exported > 0) {
  catalog.products = products;
  catalog.updatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  syncMiniprogramData(root);
}

console.log('\n完成');
console.log('  导出', result.exported, '张');
console.log('  跳过（无图）', result.skipped, '行');
console.log('  缺失', result.missing, '行');
console.log('  目录 →', path.join(root, 'images', 'hardware'));

if (result.log.length) {
  console.log('\n示例：');
  result.log.slice(0, 8).forEach(function (entry) {
    console.log('  ' + entry.id + ' · ' + entry.name + ' → ' + entry.file);
  });
  if (result.log.length > 8) {
    console.log('  … 共 ' + result.log.length + ' 条');
  }
}

if (result.warnings.length) {
  console.log('\n警告（前 5 条）：');
  result.warnings.slice(0, 5).forEach(function (w) {
    console.log('  ' + w);
  });
  if (result.warnings.length > 5) {
    console.log('  … 共 ' + result.warnings.length + ' 条');
  }
}
