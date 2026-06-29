/**
 * 从标准 Excel 导入图片与文本，更新 JSON 并复制资源到 miniprogram/assets
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { syncMiniprogramData } = require('./sync-miniprogram');

const SHEET_TYPES = {
  '设计师': 'designer',
  '商品图片': 'product',
  '案例封面': 'case'
};

const TYPE_META = {
  designer: {
    jsonFile: 'designers.json',
    listKey: 'designers',
    assetDir: 'designers',
    imageField: 'photo',
    textFields: { '姓名': 'name', '标签': 'tag' }
  },
  product: {
    jsonFile: 'catalog.json',
    listKey: 'products',
    assetDir: 'products',
    imageField: 'image',
    textFields: {}
  },
  case: {
    jsonFile: 'showcase.json',
    listKey: 'cases',
    assetDir: 'cases',
    imageField: 'cover',
    textFields: {}
  }
};

function cell(row, keys) {
  for (let i = 0; i < keys.length; i++) {
    const v = row[keys[i]];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function isUrl(value) {
  return /^https?:\/\//i.test(value);
}

function findSourceImage(imagesDir, value) {
  const candidates = [
    value,
    path.join('images', value),
    path.basename(value)
  ];
  for (let i = 0; i < candidates.length; i++) {
    const p = path.join(imagesDir, candidates[i]);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

function copyImageToAssets(sourcePath, assetDir, id, projectRoot) {
  const ext = path.extname(sourcePath).toLowerCase() || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
  const destDir = path.join(projectRoot, 'miniprogram', 'assets', assetDir);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const filename = id + safeExt;
  const destPath = path.join(destDir, filename);
  fs.copyFileSync(sourcePath, destPath);
  return '/assets/' + assetDir + '/' + filename;
}

function resolveImageValue(value, imagesDir, assetDir, id, projectRoot) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (isUrl(trimmed)) return trimmed;

  const sourcePath = findSourceImage(imagesDir, trimmed);
  if (!sourcePath) {
    throw new Error('找不到图片文件「' + trimmed + '」，请放到 content/images/ 或上传对应文件');
  }
  return copyImageToAssets(sourcePath, assetDir, id, projectRoot);
}

function readJson(projectRoot, jsonFile) {
  const filePath = path.join(projectRoot, jsonFile);
  return { filePath, data: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
}

function writeJson(filePath, data) {
  data.updatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function processSheet(sheetName, rows, imagesDir, projectRoot, log) {
  const type = SHEET_TYPES[sheetName];
  if (!type) return { skipped: true };

  const meta = TYPE_META[type];
  const { filePath, data } = readJson(projectRoot, meta.jsonFile);
  const list = data[meta.listKey];
  if (!Array.isArray(list)) {
    throw new Error(meta.jsonFile + ' 缺少 ' + meta.listKey + ' 数组');
  }

  let updated = 0;
  const warnings = [];

  rows.forEach(function (row, index) {
    const id = cell(row, ['ID', 'id', '编号']);
    if (!id) return;

    const item = list.find(function (x) { return x.id === id; });
    if (!item) {
      warnings.push(sheetName + ' 第 ' + (index + 2) + ' 行：ID「' + id + '」不存在，已跳过');
      return;
    }

    let rowChanged = false;

    Object.keys(meta.textFields).forEach(function (cnKey) {
      const field = meta.textFields[cnKey];
      const val = cell(row, [cnKey, field]);
      if (val && item[field] !== val) {
        item[field] = val;
        rowChanged = true;
      }
    });

    const imageVal = cell(row, ['图片', '封面图', '封面', meta.imageField, 'image', 'photo', 'cover']);
    if (imageVal) {
      const resolved = resolveImageValue(imageVal, imagesDir, meta.assetDir, id, projectRoot);
      if (item[meta.imageField] !== resolved) {
        item[meta.imageField] = resolved;
        rowChanged = true;
        log.push({ sheet: sheetName, id: id, image: resolved });
      }
    }

    if (rowChanged) updated += 1;
  });

  writeJson(filePath, data);
  return { updated, warnings };
}

function importFromExcel(excelPath, imagesDir, options) {
  const projectRoot = options && options.projectRoot
    ? options.projectRoot
    : path.join(__dirname, '..', '..');
  const syncAfter = !(options && options.sync === false);
  const log = [];

  if (!fs.existsSync(excelPath)) {
    throw new Error('Excel 文件不存在：' + excelPath);
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const workbook = XLSX.readFile(excelPath);
  const summary = {
    sheets: [],
    warnings: [],
    log: log
  };

  workbook.SheetNames.forEach(function (sheetName) {
    if (sheetName === '说明' || sheetName === '填写说明') return;

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) return;

  const result = processSheet(sheetName, rows, imagesDir, projectRoot, log);
    if (result.skipped) {
      summary.warnings.push('未识别的表「' + sheetName + '」，已跳过（支持：设计师 / 商品图片 / 案例封面）');
      return;
    }
    summary.sheets.push({ name: sheetName, updated: result.updated });
    summary.warnings.push.apply(summary.warnings, result.warnings);
  });

  if (syncAfter) {
    syncMiniprogramData(projectRoot);
    summary.synced = true;
  }

  return summary;
}

module.exports = {
  importFromExcel,
  SHEET_TYPES,
  TYPE_META
};
