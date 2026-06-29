/**
 * EMSUN 亿尚价格目录（XFS / ZS / DOCKT）→ catalog.json 标准产品
 */
const XLSX = require('xlsx');
const SHEET_META = {
  'XFS新风尚': { code: 'xfs', series: 'XFS新风尚2.0', style: '现代' },
  'ZS智尚': { code: 'zs', series: 'ZS智尚2.0', style: '现代' },
  'DOCKT多克': { code: 'dockt', series: 'DOCKT多克', style: '现代' }
};

const SKIP_SHEETS = ['亿尚色板库', '说明', '填写说明'];

function cleanText(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePrice(value) {
  if (value === '' || value == null) return null;
  const n = Number(String(value).replace(/[¥,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function isHeaderRow(row) {
  const first = cleanText(row[0]);
  const second = cleanText(row[1]);
  return first === '序号' && (second.indexOf('名称') >= 0 || second.indexOf('型号') >= 0);
}

function isCategoryRow(row) {
  const seq = row[0];
  const name = cleanText(row[1]);
  const spec = cleanText(row[4]);
  const price = parsePrice(row[6]);
  if (price != null) return false;
  if (typeof seq === 'string' && seq && !/^\d+$/.test(seq) && !spec && !name) return true;
  if (typeof seq === 'string' && seq && !/^\d+$/.test(seq) && !spec && name && name === seq) return true;
  if (typeof seq === 'string' && seq && !/^\d+$/.test(seq) && !spec) return true;
  return false;
}

function normalizeUnit(raw, fallback) {
  const unit = cleanText(raw) || fallback || '件';
  return unit || '件';
}

function summarizeColor(raw) {
  const text = cleanText(raw);
  if (!text) return '灰色';
  if (/白|雪花/.test(text)) return '浅色';
  if (/黑|哑光黑/.test(text)) return '深色';
  if (/灰|橡|胡桃|木|蓝|青/.test(text)) return '大地色';
  return '灰色';
}

function buildProductId(sheetCode, index) {
  return 'emsun-' + sheetCode + '-' + String(index).padStart(4, '0');
}

function parseSheet(sheetName, rows, warnings) {
  const meta = SHEET_META[sheetName];
  if (!meta) return [];

  const products = [];
  let category = sheetName;
  let currentName = '';
  let currentMaterial = '';
  let currentUnit = '件';
  let currentColor = '';
  let seqNo = '';
  let counter = 0;

  rows.forEach(function (row, rowIndex) {
    if (rowIndex < 2) return;
    if (isHeaderRow(row)) return;

    if (isCategoryRow(row)) {
      category = cleanText(row[0]) || category;
      currentName = '';
      currentMaterial = '';
      return;
    }

    const seq = row[0];
    const name = cleanText(row[1]);
    const spec = cleanText(row[4]);
    const colorRaw = cleanText(row[5]);
    const price = parsePrice(row[6]);
    const unit = normalizeUnit(row[7], currentUnit);
    const material = cleanText(row[8]);

    if (typeof seq === 'number' || (typeof seq === 'string' && /^\d+$/.test(seq))) {
      if (!name) return;
      seqNo = String(seq);
      currentName = name;
      currentMaterial = material || currentMaterial;
      currentUnit = unit || currentUnit;
      currentColor = colorRaw || currentColor;
    }

    if (!spec || price == null) return;

    const baseName = currentName || name;
    if (!baseName) {
      warnings.push(sheetName + ' 第 ' + (rowIndex + 1) + ' 行：缺少产品名称，已跳过');
      return;
    }

    counter += 1;
    const id = buildProductId(meta.code, counter);
    const specText = spec.indexOf('规格：') === 0 ? spec : spec;
    const displayName = baseName;

    products.push({
      id: id,
      name: displayName,
      emoji: '💼',
      space: '办公家具',
      sub: category,
      style: meta.style,
      color: summarizeColor(colorRaw || currentColor),
      spec: specText,
      material: (material || currentMaterial || colorRaw || '—').slice(0, 240),
      price: price,
      unitPrice: price,
      unit: unit || currentUnit || '件',
      qty: 1,
      coef: 1,
      channels: ['custom'],
      quoteSections: ['products'],
      image: '',
      imageLocal: '/images/products/' + id + '.jpg',
      meta: {
        importSource: 'emsun-2026',
        sourceRef: meta.code + '-' + (seqNo || '0') + '-' + counter,
        series: meta.series,
        sheet: sheetName,
        category: category,
        seq: seqNo,
        row: rowIndex + 1
      }
    });
  });

  return products;
}

function convertEmsunWorkbook(workbook) {
  const warnings = [];
  const products = [];

  workbook.SheetNames.forEach(function (sheetName) {
    if (SKIP_SHEETS.indexOf(sheetName) >= 0) return;
    if (!SHEET_META[sheetName]) {
      warnings.push('未识别的工作表「' + sheetName + '」，已跳过');
      return;
    }
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: '',
      header: 1
    });
    const parsed = parseSheet(sheetName, rows, warnings);
    products.push.apply(products, parsed);
    if (!parsed.length) {
      warnings.push('工作表「' + sheetName + '」未解析到产品行');
    }
  });

  return { products: products, warnings: warnings };
}

function applyEmsunToCatalog(existingProducts, incomingProducts) {
  const list = existingProducts || [];
  const withoutOld = list.filter(function (p) {
    return !(p.meta && p.meta.importSource === 'emsun-2026');
  });
  const removed = list.length - withoutOld.length;

  incomingProducts.forEach(function (item) {
    withoutOld.push(item);
  });

  return {
    products: withoutOld,
    created: incomingProducts.length,
    removed: removed
  };
}

module.exports = {
  SHEET_META: SHEET_META,
  convertEmsunWorkbook: convertEmsunWorkbook,
  applyEmsunToCatalog: applyEmsunToCatalog
};
