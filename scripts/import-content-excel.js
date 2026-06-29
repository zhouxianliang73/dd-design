/**
 * 从 Excel 导入图片与文案
 *   node scripts/import-content-excel.js
 *   node scripts/import-content-excel.js content/dd-content.xlsx content/images
 */
const path = require('path');
const { importFromExcel } = require('./lib/content-import');

const root = path.join(__dirname, '..');
const excelPath = process.argv[2] || path.join(root, 'content', 'dd-content.xlsx');
const imagesDir = process.argv[3] || path.join(root, 'content', 'images');

try {
  const summary = importFromExcel(excelPath, imagesDir, { projectRoot: root });
  console.log('导入完成');
  summary.sheets.forEach(function (s) {
    var line = '  ' + s.name + '：更新 ' + s.updated + ' 条';
    if (s.created) line += '，新增 ' + s.created + ' 条';
    console.log(line);
  });
  if (summary.log.length) {
    console.log('图片写入：');
    summary.log.forEach(function (item) {
      console.log('  ' + item.id + ' → ' + item.image);
    });
  }
  if (summary.warnings.length) {
    console.log('提示：');
    summary.warnings.forEach(function (w) { console.log('  ' + w); });
  }
} catch (err) {
  console.error('导入失败：', err.message);
  process.exit(1);
}
