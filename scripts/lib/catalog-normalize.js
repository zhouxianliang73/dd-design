/**
 * 外网商品行 → catalog.json 标准产品（清洗 + 校验）
 */
const { COLUMN_ALIASES, QUOTE_SECTION_DEFAULTS, VALID_CHANNELS } = require('./catalog-schema');

function cell(row, keys) {
  for (let i = 0; i < keys.length; i++) {
    const v = row[keys[i]];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function pickField(row, key) {
  const aliases = COLUMN_ALIASES[key] || [key];
  return cell(row, aliases);
}

function parseNumber(value) {
  if (value === '' || value == null) return null;
  const n = Number(String(value).replace(/[¥,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parseIntDim(value) {
  const n = parseNumber(value);
  if (n == null) return null;
  return Math.round(n);
}

function parseBool(value) {
  const s = String(value || '').trim().toLowerCase();
  if (!s) return false;
  return s === '是' || s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value)
    .split(/[,，;；|/]+/)
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
}

function defaultQuoteSections(space, sub) {
  if (space === '不锈钢橱柜') {
    if (sub === '台面') return ['countertop'];
    if (sub === '功能配件' || sub === '水槽' || sub === '电器') return ['hardware'];
    if (sub === '见光板' || sub === '地脚线' || sub === '顶封板') return ['trim'];
    if (sub === '增加项目') return ['extras'];
    return ['cabinet'];
  }
  return ['products'];
}

function normalizeChannels(list) {
  return list.filter(function (ch) {
    return VALID_CHANNELS.indexOf(ch) >= 0;
  });
}

/**
 * 将 Excel 一行清洗为标准 product 对象（不含 image 解析）
 * @returns {{ product: object|null, errors: string[], warnings: string[] }}
 */
function normalizeProductRow(row, rowIndex) {
  const errors = [];
  const warnings = [];
  const line = rowIndex != null ? '第 ' + rowIndex + ' 行' : '';

  const id = pickField(row, 'id');
  const name = pickField(row, 'name');
  const space = pickField(row, 'space');

  if (!id) {
    return { product: null, errors: [line + '：缺少 ID，已跳过'], warnings: warnings };
  }
  if (!name) {
    errors.push(line + ' ID「' + id + '」：缺少名称');
  }
  if (!space) {
    errors.push(line + ' ID「' + id + '」：缺少空间（品类）');
  }

  const price = parseNumber(pickField(row, 'price'));
  const unitPrice = price;
  const qty = parseNumber(pickField(row, 'qty'));
  const coef = parseNumber(pickField(row, 'coef'));
  const w = parseIntDim(pickField(row, 'w'));
  const h = parseIntDim(pickField(row, 'h'));
  const d = parseIntDim(pickField(row, 'd'));

  const sub = pickField(row, 'sub');
  let channels = normalizeChannels(parseList(pickField(row, 'channels')));
  let quoteSections = parseList(pickField(row, 'quoteSections'));
  if (!quoteSections.length) {
    quoteSections = defaultQuoteSections(space, sub);
  }

  const material = pickField(row, 'material');
  const materialDoor = pickField(row, 'materialDoor');
  const sourceRef = pickField(row, 'sourceRef');

  if (pickField(row, 'channels') && !channels.length) {
    warnings.push(line + ' ID「' + id + '」：渠道值无法识别，请用 ' + VALID_CHANNELS.join(', '));
  }

  const product = {
    id: id,
    name: name,
    space: space,
    sub: sub || '',
    style: pickField(row, 'style') || '',
    color: pickField(row, 'color') || '',
    spec: pickField(row, 'spec') || '',
    quoteSections: quoteSections,
  };

  if (price != null) {
    product.price = price;
    product.unitPrice = unitPrice;
  }

  if (material) product.material = material;
  if (materialDoor) product.materialDoor = materialDoor;
  if (space === '不锈钢橱柜' && material && !product.materialBody) {
    product.materialBody = material;
  }

  const emoji = pickField(row, 'emoji');
  if (emoji) product.emoji = emoji;

  if (parseBool(pickField(row, 'featured'))) {
    product.featured = true;
  }

  if (channels.length) product.channels = channels;

  product.unit = pickField(row, 'unit') || undefined;
  if (qty != null && qty > 0) product.qty = qty;
  if (coef != null && coef > 0) product.coef = coef;

  if (w != null) product.w = w;
  if (h != null) product.h = h;
  if (d != null) product.d = d;

  if (sourceRef) {
    product.meta = { sourceRef: sourceRef };
  }

  const imageRaw = pickField(row, 'image');
  if (imageRaw) {
    product._imageRaw = imageRaw;
  }

  return {
    product: errors.length ? null : product,
    errors: errors,
    warnings: warnings,
  };
}

/** catalog 产品 → Excel 行 */
function productToRow(product) {
  const meta = product.meta || {};
  const sourceRefs = meta.sourceRefs || (meta.sourceRef ? [meta.sourceRef] : []);
  return {
    ID: product.id || '',
    名称: product.name || '',
    空间: product.space || '',
    子类: product.sub || '',
    风格: product.style || '',
    颜色: product.color || '',
    规格: product.spec || '',
    材质: product.material || product.materialBody || '',
    '材质(门板)': product.materialDoor || '',
    单价: product.price != null ? product.price : (product.unitPrice || ''),
    单位: product.unit || '',
    数量: product.qty != null ? product.qty : '',
    宽mm: product.w != null ? product.w : '',
    高mm: product.h != null ? product.h : '',
    深mm: product.d != null ? product.d : '',
    系数: product.coef != null ? product.coef : '',
    图标: product.emoji || '',
    爆款: product.featured ? '是' : '',
    渠道: (product.channels || []).join(','),
    清单分组: (product.quoteSections || []).join(','),
    图片: product.image || '',
    外网来源: sourceRefs.join(','),
    规格数: Array.isArray(meta.variants) && meta.variants.length ? meta.variants.length : '',
  };
}

function mergeProduct(existing, incoming) {
  const merged = Object.assign({}, existing);
  Object.keys(incoming).forEach(function (key) {
    if (incoming[key] !== undefined && incoming[key] !== '') {
      merged[key] = incoming[key];
    }
  });
  if (existing.meta || incoming.meta) {
    merged.meta = Object.assign({}, existing.meta || {}, incoming.meta || {});
  }
  delete merged._imageRaw;
  return merged;
}

module.exports = {
  normalizeProductRow,
  productToRow,
  mergeProduct,
  pickField,
  parseList,
};
