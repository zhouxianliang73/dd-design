/**
 * 从标准 Excel 导入 · 三表：设计师 / 商品清单 / 案例封面
 * 外网文件先按 scripts/lib/catalog-schema.js 列结构清洗，再写入 catalog.json
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { syncMiniprogramData } = require('./sync-miniprogram');
const { normalizeProductRow, mergeProduct } = require('./catalog-normalize');
const { exportDesignerAvatarsFromXlsx, parseDispimgId } = require('./extract-wps-dispimg-images');

const SHEET_TYPES = {
  '设计师': 'designer',
  '商品清单': 'product',
  '商品图片': 'product',
  '案例封面': 'case',
};

const TYPE_META = {
  designer: {
    jsonFile: 'designers.json',
    listKey: 'designers',
    assetDir: 'designers',
    imageField: 'photo',
    textFields: { '姓名': 'name', '标签': 'tag' },
  },
  case: {
    jsonFile: 'showcase.json',
    listKey: 'cases',
    assetDir: 'cases',
    imageField: 'cover',
    textFields: {},
  },
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
  const candidates = [value, path.join('images', value), path.basename(value)];
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

function isDispimg(value) {
  return /=DISPIMG/i.test(String(value || ''));
}

function normalizeImageInput(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed || isDispimg(trimmed)) return trimmed;
  if (isUrl(trimmed)) return trimmed;
  if (/^photo-\d+/i.test(trimmed)) {
    return 'https://images.unsplash.com/' + trimmed.replace(/^\/+/, '');
  }
  if (trimmed.indexOf('images.unsplash.com') >= 0) {
    return trimmed.indexOf('http') === 0 ? trimmed : 'https://' + trimmed.replace(/^\/+/, '');
  }
  return trimmed;
}

function resolveImageValue(value, imagesDir, assetDir, id, projectRoot) {
  if (!value) return null;
  const trimmed = normalizeImageInput(value);
  if (!trimmed) return null;
  if (isDispimg(trimmed)) return null;
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

function processSimpleSheet(sheetName, type, rows, imagesDir, projectRoot, log) {
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
      if (isDispimg(imageVal)) {
        if (type === 'designer') {
          const extCandidates = ['.jpg', '.png', '.webp'];
          let localPhoto = '';
          for (let i = 0; i < extCandidates.length; i += 1) {
            const abs = path.join(projectRoot, 'images', meta.assetDir, id + extCandidates[i]);
            if (fs.existsSync(abs)) {
              localPhoto = '/images/' + meta.assetDir + '/' + id + extCandidates[i];
              break;
            }
          }
          if (localPhoto && item[meta.imageField] !== localPhoto) {
            item[meta.imageField] = localPhoto;
            rowChanged = true;
            log.push({ sheet: sheetName, id: id, image: localPhoto });
          } else if (!localPhoto) {
            warnings.push(
              sheetName + ' 第 ' + (index + 2) + ' 行 ID「' + id + '」：嵌入图未导出，请先 npm run content:import-designers'
            );
          }
        } else {
          warnings.push(sheetName + ' 第 ' + (index + 2) + ' 行 ID「' + id + '」：图例为 Excel 嵌入图，请导出图片后重新导入');
        }
      } else {
        try {
          const resolved = resolveImageValue(imageVal, imagesDir, meta.assetDir, id, projectRoot);
          if (resolved && item[meta.imageField] !== resolved) {
            item[meta.imageField] = resolved;
            rowChanged = true;
            log.push({ sheet: sheetName, id: id, image: resolved });
          }
        } catch (err) {
          warnings.push(sheetName + ' 第 ' + (index + 2) + ' 行 ID「' + id + '」：' + err.message);
        }
      }
    }

    if (rowChanged) updated += 1;
  });

  writeJson(filePath, data);
  return { updated, created: 0, warnings };
}

function isLegacyProductImageRow(row) {
  const id = cell(row, ['ID', 'id']);
  const image = cell(row, ['图片', 'image', '封面']);
  const space = cell(row, ['空间', 'space']);
  const name = cell(row, ['名称', 'name']);
  return id && image && !space && !name;
}

function processProductSheet(sheetName, rows, imagesDir, projectRoot, log) {
  const { filePath, data } = readJson(projectRoot, 'catalog.json');
  const list = data.products;
  if (!Array.isArray(list)) {
    throw new Error('catalog.json 缺少 products 数组');
  }

  let updated = 0;
  let created = 0;
  const warnings = [];
  const errors = [];

  rows.forEach(function (row, index) {
    const rowNum = index + 2;

    if (isLegacyProductImageRow(row)) {
      const id = cell(row, ['ID', 'id']);
      const item = list.find(function (x) { return x.id === id; });
      if (!item) {
        warnings.push(sheetName + ' 第 ' + rowNum + ' 行：ID「' + id + '」不存在，已跳过');
        return;
      }
      const imageVal = cell(row, ['图片', 'image']);
      if (isDispimg(imageVal)) {
        warnings.push(sheetName + ' 第 ' + rowNum + ' 行 ID「' + id + '」：图例为 Excel 嵌入图，请导出图片后重新导入');
        return;
      }
      try {
        const resolved = resolveImageValue(imageVal, imagesDir, 'products', id, projectRoot);
        if (resolved && item.image !== resolved) {
          item.image = resolved;
          updated += 1;
          log.push({ sheet: sheetName, id: id, image: resolved });
        }
      } catch (err) {
        warnings.push(sheetName + ' 第 ' + rowNum + ' 行 ID「' + id + '」：' + err.message);
      }
      return;
    }

    const result = normalizeProductRow(row, rowNum);

    warnings.push.apply(warnings, result.warnings);
    if (result.errors.length) {
      errors.push.apply(errors, result.errors);
      return;
    }
    if (!result.product) return;

    const incoming = result.product;
    const imageRaw = incoming._imageRaw;
    delete incoming._imageRaw;

    let item = list.find(function (x) { return x.id === incoming.id; });
    const isNew = !item;

    if (isNew) {
      item = incoming;
      if (!item.unit) item.unit = '个';
      if (!item.qty) item.qty = 1;
      if (!item.coef) item.coef = 1;
      if (item.price == null) item.price = 0;
      if (item.unitPrice == null && item.price != null) item.unitPrice = item.price;
      if (!item.image) item.image = '';
      list.push(item);
      created += 1;
    } else {
      const before = JSON.stringify(item);
      item = mergeProduct(item, incoming);
      if (JSON.stringify(item) !== before) {
        updated += 1;
      }
    }

    if (imageRaw) {
      if (isDispimg(imageRaw)) {
        warnings.push(sheetName + ' 第 ' + rowNum + ' 行 ID「' + incoming.id + '」：图例为 Excel 嵌入图，请导出图片后重新导入');
      } else {
        try {
          const resolved = resolveImageValue(imageRaw, imagesDir, 'products', incoming.id, projectRoot);
          if (resolved && item.image !== resolved) {
            item.image = resolved;
            log.push({ sheet: sheetName, id: incoming.id, image: resolved });
          }
        } catch (err) {
          warnings.push(sheetName + ' 第 ' + rowNum + ' 行 ID「' + incoming.id + '」：' + err.message);
        }
      }
    }
  });

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  writeJson(filePath, data);
  return { updated, created, warnings };
}

function processSheet(sheetName, rows, imagesDir, projectRoot, log) {
  const type = SHEET_TYPES[sheetName];
  if (!type) return { skipped: true };

  if (type === 'product') {
    return processProductSheet(sheetName, rows, imagesDir, projectRoot, log);
  }

  return processSimpleSheet(sheetName, type, rows, imagesDir, projectRoot, log);
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
    log: log,
  };

  workbook.SheetNames.forEach(function (sheetName) {
    if (sheetName === '说明' || sheetName === '填写说明') return;

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) return;

    if (SHEET_TYPES[sheetName] === 'designer') {
      const hasDispimg = rows.some(function (row) {
        const imageVal = cell(row, ['图片', 'photo', 'image']);
        return parseDispimgId(imageVal);
      });
      if (hasDispimg) {
        exportDesignerAvatarsFromXlsx(excelPath, { projectRoot: projectRoot, updateJson: true });
      }
    }

    const result = processSheet(sheetName, rows, imagesDir, projectRoot, log);
    if (result.skipped) {
      summary.warnings.push(
        '未识别的表「' + sheetName + '」，已跳过（支持：设计师 / 商品清单 / 案例封面）'
      );
      return;
    }
    summary.sheets.push({
      name: sheetName,
      updated: result.updated,
      created: result.created || 0,
    });
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
  TYPE_META,
};
