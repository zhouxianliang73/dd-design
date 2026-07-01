/**
 * 从 dd-content-template.xlsx「设计师」表导出嵌入头像
 *   npm run content:import-designers
 *   node scripts/import-designer-avatars-xlsx.js content/dd-content-template.xlsx
 */
const fs = require('fs');
const path = require('path');
const { syncMiniprogramData } = require('./lib/sync-miniprogram');
const { exportDesignerAvatarsFromXlsx } = require('./lib/extract-wps-dispimg-images');

const root = path.join(__dirname, '..');
const inputPath =
  process.argv[2] || path.join(root, 'content', 'dd-content-template.xlsx');

if (!fs.existsSync(inputPath)) {
  console.error('文件不存在：' + inputPath);
  process.exit(1);
}

console.log('导入设计师头像', inputPath);

const result = exportDesignerAvatarsFromXlsx(inputPath, {
  projectRoot: root,
  updateJson: true,
});

syncMiniprogramData(root);

console.log('\n完成');
console.log('  导出', result.exported, '张 → images/designers/');
console.log('  跳过', result.skipped, '行 · 缺失', result.missing, '行');
console.log('  已更新 designers.json 并 sync miniprogram/data');

if (result.log.length) {
  console.log('\n示例：');
  result.log.forEach(function (entry) {
    console.log('  ' + entry.id + ' · ' + entry.name + ' → ' + entry.file);
  });
}

if (result.warnings.length) {
  console.log('\n提示：');
  result.warnings.forEach(function (w) {
    console.log('  ' + w);
  });
}
