/**
 * 从询价 Excel 导入项目（各供应商独立报价，非比价矩阵）
 *   node scripts/import-inquiry-excel.js [excel路径]
 */
const fs = require('fs');
const path = require('path');
const { readInquiryExcel } = require('./lib/inquiry-excel-parser');
const { writeInquiryBundle } = require('./lib/write-inquiry-bundle');

const root = path.join(__dirname, '..');
const defaultExcel = path.join(root, 'content', 'samples', '不锈钢书柜.xlsx');
const excelPath = process.argv[2] || defaultExcel;

if (!fs.existsSync(excelPath)) {
  console.error('找不到 Excel：', excelPath);
  process.exit(1);
}

const bundle = readInquiryExcel(excelPath);
const slug = bundle.slug;
const { projectDir, mpOut } = writeInquiryBundle(bundle, root);

console.log('已导入项目', projectDir);
console.log('  供应商', bundle.suppliers.length, '家');
bundle.suppliers.forEach(function (s) {
  console.log('   -', s.name, s.totalText || '合计待核', '行数', s.lines.length);
});
console.log('已同步小程序数据', mpOut);
