/**
 * 导入五金价目表（桌面 五金.xlsx 或指定路径）
 *   npm run content:import-hardware
 *   node scripts/import-hardware-xlsx.js "c:/path/五金.xlsx"
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { syncMiniprogramData } = require('./lib/sync-miniprogram');
const { convertHardwareRows, applyToCatalog } = require('./lib/convert-hardware-xlsx');
const { exportHardwareImagesFromXlsx } = require('./lib/extract-wps-dispimg-images');
const { productToRow } = require('./lib/catalog-normalize');

const root = path.join(__dirname, '..');
const inputPath = process.argv[2] || 'c:/Users/LocalAccount/Desktop/五金.xlsx';
const outExcel = path.join(root, 'content', 'dd-hardware-cleaned.xlsx');

if (!fs.existsSync(inputPath)) {
  console.error('文件不存在：' + inputPath);
  process.exit(1);
}

const wb = XLSX.readFile(inputPath);
const sheetName = wb.SheetNames.find(function (n) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' });
  return rows.length > 0;
});

if (!sheetName) {
  console.error('Excel 中没有数据行');
  process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
const catalogPath = path.join(root, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const products = catalog.products || [];

console.log('读取', inputPath);
console.log('  工作表', sheetName, '·', rows.length, '行');

const converted = convertHardwareRows(rows, products);
const applied = applyToCatalog(products, converted);

catalog.products = products;
catalog.updatedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');

const cleanedRows = converted.items.map(function (item) {
  return productToRow(item.product);
});

const outWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  outWb,
  XLSX.utils.json_to_sheet(cleanedRows),
  '商品清单'
);
if (!fs.existsSync(path.dirname(outExcel))) {
  fs.mkdirSync(path.dirname(outExcel), { recursive: true });
}
XLSX.writeFile(outWb, outExcel);

const imageResult = exportHardwareImagesFromXlsx(inputPath, {
  projectRoot: root,
  products: products,
  updateCatalog: true,
});

if (imageResult.exported > 0) {
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
}

syncMiniprogramData(root);

console.log('\n导入完成 → catalog.json');
console.log('  新增', applied.created, '条 · 更新', applied.updated, '条');
console.log('  清洗后标准表 →', outExcel);
console.log('  已 sync miniprogram/data');
console.log('  嵌入图导出', imageResult.exported, '张 → images/hardware/');
if (imageResult.missing > 0) {
  console.log('  嵌入图缺失', imageResult.missing, '行');
}

if (converted.warnings.length) {
  console.log('\n提示（前 10 条）：');
  converted.warnings.slice(0, 10).forEach(function (w) { console.log('  ' + w); });
  if (converted.warnings.length > 10) {
    console.log('  … 共 ' + converted.warnings.length + ' 条（多为 Excel 嵌入图例）');
  }
}

console.log('\n匹配更新示例：');
applied.log.filter(function (l) { return l.action === 'update'; }).slice(0, 5).forEach(function (l) {
  console.log('  更新 ' + l.id + ' · ' + l.name);
});
