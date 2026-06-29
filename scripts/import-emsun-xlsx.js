/**
 * 导入 EMSUN 亿尚价格目录（办公家具）
 *   npm run content:import-emsun
 *   node scripts/import-emsun-xlsx.js "c:/path/VP  EMSUN亿尚价格目录（2026）.xlsx"
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { syncMiniprogramData } = require('./lib/sync-miniprogram');
const { convertEmsunWorkbook, applyEmsunToCatalog } = require('./lib/convert-emsun-xlsx');

const root = path.join(__dirname, '..');
const defaultPath = 'c:/Users/LocalAccount/Desktop/VP  EMSUN亿尚价格目录（2026）.xlsx';
const inputPath = process.argv[2] || defaultPath;
const outExcel = path.join(root, 'content', 'dd-emsun-cleaned.xlsx');

if (!fs.existsSync(inputPath)) {
  console.error('文件不存在：' + inputPath);
  process.exit(1);
}

const workbook = XLSX.readFile(inputPath);
const converted = convertEmsunWorkbook(workbook);

console.log('读取', inputPath);
console.log('  工作表', workbook.SheetNames.join(' · '));
console.log('  解析产品', converted.products.length, '条');

const catalogPath = path.join(root, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const applied = applyEmsunToCatalog(catalog.products || [], converted.products);

catalog.products = applied.products;
catalog.updatedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');

const cleanedRows = converted.products.map(function (p) {
  return {
    ID: p.id,
    名称: p.name,
    空间: p.space,
    子类: p.sub,
    风格: p.style,
    颜色: p.color,
    规格: p.spec,
    材质: p.material,
    单价: p.price,
    单位: p.unit,
    系列: p.meta.series,
    来源表: p.meta.sheet
  };
});

const outWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(outWb, XLSX.utils.json_to_sheet(cleanedRows), '商品清单');
if (!fs.existsSync(path.dirname(outExcel))) {
  fs.mkdirSync(path.dirname(outExcel), { recursive: true });
}
XLSX.writeFile(outWb, outExcel);

syncMiniprogramData(root);

console.log('\n导入完成 → catalog.json');
console.log('  移除旧 EMSUN 条目', applied.removed, '条');
console.log('  写入新 EMSUN 条目', applied.created, '条');
console.log('  清洗后标准表 →', outExcel);
console.log('  已 sync miniprogram/data');

if (converted.warnings.length) {
  console.log('\n提示（前 10 条）：');
  converted.warnings.slice(0, 10).forEach(function (w) {
    console.log('  ' + w);
  });
}

console.log('\n示例：');
converted.products.slice(0, 5).forEach(function (p) {
  console.log('  ' + p.id + ' · ' + p.name + ' · ¥' + p.price + ' / ' + p.unit);
});

console.log('\n图片：Excel 内嵌图无法直接导出。若有产品图，请放到 images/products/emsun-xfs-0001.jpg 后执行 npm run sync');
