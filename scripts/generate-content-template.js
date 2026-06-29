/**
 * 生成标准 Excel 模板 content/dd-content-template.xlsx
 *   npm run content:template
 *
 * 三表：设计师 · 商品清单（外网标准）· 案例封面
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PRODUCT_COLUMNS } = require('./lib/catalog-schema');
const { productToRow } = require('./lib/catalog-normalize');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'content');
const outPath = path.join(outDir, 'dd-content-template.xlsx');

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
}

const designers = readJson('designers.json').designers || [];
const products = readJson('catalog.json').products || [];
const cases = readJson('showcase.json').cases || [];

const guideRows = [
  { 项目: '表结构', 说明: '三张表：设计师 · 商品清单 · 案例封面（Designer / Catalog / Showcase）' },
  { 项目: '外网接入', 说明: '供应商/外网 Excel 先按「商品清单」列名清洗对齐，再导入；列名支持常见别名（品名→名称、SKU→ID 等）' },
  { 项目: '商品清单', 说明: '与 catalog.json 产品清单字段一致：空间/子类/规格/单价/渠道/清单分组/图片等' },
  { 项目: '新增商品', 说明: '填写新 ID + 必填列（ID、名称、空间），导入时自动追加到 catalog.json' },
  { 项目: '图片列', 说明: 'https://… 或本地文件名（放 content/images/）' },
  { 项目: '导入', 说明: 'npm run content:admin 页面上传，或 npm run content:import' },
  { 项目: '同步', 说明: '导入后自动 sync 到 miniprogram/data/*.js' },
];

const designerRows = designers.map(function (d) {
  return {
    ID: d.id,
    姓名: d.name,
    标签: d.tag,
    图片: path.basename(d.photo || '') || d.photo || '',
  };
});

const productRows = products.map(productToRow);

const caseRows = cases.map(function (c) {
  return {
    ID: c.id,
    '标题(参考)': c.title,
    图片: path.basename(c.cover || '') || c.cover || '',
  };
});

const productGuideRows = PRODUCT_COLUMNS.map(function (col) {
  return { 列名: col.header, 必填: col.required ? '是' : '', 说明: col.hint || '' };
});

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(guideRows), '填写说明');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productGuideRows), '商品清单说明');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(designerRows), '设计师');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productRows), '商品清单');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(caseRows), '案例封面');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function writeWorkbook(wb, targetPath) {
  XLSX.writeFile(wb, targetPath);
}

let savedPath = outPath;
try {
  writeWorkbook(wb, outPath);
} catch (err) {
  if (err.code === 'EBUSY') {
    savedPath = path.join(outDir, 'dd-content-template-new.xlsx');
    writeWorkbook(wb, savedPath);
    console.warn('原文件被占用，已写入', savedPath);
    console.warn('请关闭 Excel 后，将该文件重命名覆盖 dd-content-template.xlsx');
  } else {
    throw err;
  }
}

console.log('已生成', savedPath);
console.log('  设计师 ' + designerRows.length + ' 行 · 商品清单 ' + productRows.length + ' 行 · 案例封面 ' + caseRows.length + ' 行');
