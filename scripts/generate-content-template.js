/**
 * 生成标准 Excel 模板 content/dd-content-template.xlsx
 *   node scripts/generate-content-template.js
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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
  { 项目: '文件位置', 说明: '把填好的表保存为 content/dd-content.xlsx，图片放在 content/images/' },
  { 项目: '表结构', 说明: '三张表：设计师、商品图片、案例封面。只需改有变化的行。' },
  { 项目: '图片列', 说明: '可填完整网址 https://...，或本地文件名如 zhangjun.jpg（需放在 images 文件夹）' },
  { 项目: '导入方式', 说明: '后台页面上传，或运行 node scripts/import-content-excel.js' },
  { 项目: '同步小程序', 说明: '导入后会自动写入 miniprogram/data/*.js，微信开发者工具重新编译即可' }
];

const designerRows = designers.map(function (d) {
  return {
    ID: d.id,
    姓名: d.name,
    标签: d.tag,
    图片: path.basename(d.photo || '') || ''
  };
});

const productRows = products.map(function (p) {
  return {
    ID: p.id,
    '名称(参考)': p.name,
    图片: path.basename(p.image || '') || ''
  };
});

const caseRows = cases.map(function (c) {
  return {
    ID: c.id,
    '标题(参考)': c.title,
    图片: path.basename(c.cover || '') || ''
  };
});

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(guideRows), '填写说明');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(designerRows), '设计师');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productRows), '商品图片');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(caseRows), '案例封面');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
XLSX.writeFile(wb, outPath);
console.log('已生成', outPath);
