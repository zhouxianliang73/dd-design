/**
 * 五金价目表（如桌面 五金.xlsx）→ catalog 标准产品
 * 列：序号 · (分类) · 产品名称 · 物料编码 · 图例 · 规格尺寸 · 单位 · 零售价 · 备注
 */
const { normalizeProductRow, mergeProduct } = require('./catalog-normalize');

function parseUnit(raw) {
  const s = String(raw || '').trim();
  if (!s) return '个';
  const m = s.match(/元\/(.+)/);
  if (m) return m[1].trim();
  return s.replace(/^元\/?/, '') || '个';
}

function cleanName(name) {
  return String(name || '').replace(/\s+/g, ' ').trim();
}

function materialCode(raw) {
  if (raw == null || raw === '') return '';
  return String(raw).replace(/\s/g, '');
}

function hardwareRowToStandard(row) {
  const category = String(row.__EMPTY || row['分类'] || row['类别'] || '').trim();
  const name = cleanName(row['产品名称'] || row['名称'] || row.name);
  const code = materialCode(row['物料编码'] || row['SKU'] || row.sourceRef);
  const spec = String(row['规格尺寸'] || row['规格'] || '').replace(/\n/g, ' ').trim();
  const note = String(row['备注'] || '').trim();
  const price = row['零售价'] != null && row['零售价'] !== '' ? row['零售价'] : row['单价'];

  let specFull = spec;
  if (category && spec && spec.indexOf(category) < 0) {
    specFull = category + ' · ' + spec;
  } else if (category && !spec) {
    specFull = category;
  }
  if (note) {
    specFull = specFull ? specFull + ' · ' + note : note;
  }

  return {
    名称: name,
    空间: '不锈钢橱柜',
    子类: '功能配件',
    风格: '现代',
    颜色: '灰色',
    规格: specFull,
    单价: price,
    单位: parseUnit(row['单位']),
    数量: 1,
    系数: 1,
    图标: '⚙️',
    清单分组: 'hardware',
    外网来源: code,
    _category: category,
    _imageRaw: row['图例'] || row['图片'] || '',
  };
}

function findExistingByName(list, name) {
  const target = cleanName(name);
  for (let i = 0; i < list.length; i++) {
    if (cleanName(list[i].name) === target) return list[i];
  }
  return null;
}

function nextHardwareId(list) {
  let max = 0;
  list.forEach(function (item) {
    const m = String(item.id || '').match(/^k-hw-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return 'k-hw-' + String(max + 1).padStart(3, '0');
}

function isDispimg(value) {
  return /=DISPIMG/i.test(String(value || ''));
}

/**
 * @param {object[]} rows - Sheet1 rows from 五金.xlsx
 * @param {object[]} existingProducts - catalog.products
 */
function convertHardwareRows(rows, existingProducts) {
  const list = existingProducts || [];
  const warnings = [];
  const results = [];
  const usedIds = {};

  list.forEach(function (p) {
    usedIds[p.id] = true;
  });

  rows.forEach(function (row, index) {
    const name = cleanName(row['产品名称'] || row['名称']);
    if (!name) return;

    const stdRow = hardwareRowToStandard(row);
    const code = stdRow.外网来源;

    let id = '';
    const existing = findExistingByName(list, name);
    if (existing) {
      id = existing.id;
    } else if (code) {
      id = 'k-hw-m' + code.slice(-8);
      if (usedIds[id]) {
        id = nextHardwareId(list.concat(results.map(function (r) { return r.product; })));
      }
    } else {
      id = nextHardwareId(list.concat(results.map(function (r) { return r.product; })));
    }

    stdRow.ID = id;
    usedIds[id] = true;

    if (isDispimg(stdRow._imageRaw)) {
      delete stdRow._imageRaw;
    }

    const normalized = normalizeProductRow(stdRow, index + 2);
    if (normalized.errors.length) {
      warnings.push.apply(warnings, normalized.errors);
      return;
    }

    let product = normalized.product;
    product.emoji = '⚙️';
    product.color = product.color || '灰色';
    product.style = product.style || '现代';
    product.techParams = stdRow._category || '';
    if (product.meta) {
      product.meta.hardwareGroup = stdRow._category;
      product.meta.importSource = 'hardware-xlsx';
    } else {
      product.meta = {
        sourceRef: code,
        hardwareGroup: stdRow._category,
        importSource: 'hardware-xlsx',
      };
    }

    results.push({
      product: product,
      existing: existing,
      warnings: normalized.warnings,
    });
  });

  return { items: results, warnings: warnings };
}

function applyToCatalog(products, convertResult) {
  let created = 0;
  let updated = 0;
  const log = [];

  convertResult.items.forEach(function (item) {
    if (item.existing) {
      const idx = products.findIndex(function (p) { return p.id === item.existing.id; });
      if (idx >= 0) {
        products[idx] = mergeProduct(products[idx], item.product);
        updated += 1;
        log.push({ action: 'update', id: item.product.id, name: item.product.name });
      }
    } else {
      const p = item.product;
      if (!p.unit) p.unit = '个';
      if (!p.qty) p.qty = 1;
      if (!p.coef) p.coef = 1;
      if (p.price == null) p.price = 0;
      if (p.unitPrice == null) p.unitPrice = p.price;
      if (!p.image) {
        p.image = 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=320&h=180&fit=crop&auto=format&q=80';
      }
      if (!p.imageLocal) {
        p.imageLocal = '/images/hardware/' + p.id + '.jpg';
      }
      products.push(p);
      created += 1;
      log.push({ action: 'create', id: p.id, name: p.name });
    }
  });

  return { created, updated, log };
}

module.exports = {
  hardwareRowToStandard,
  convertHardwareRows,
  applyToCatalog,
  parseUnit,
};
