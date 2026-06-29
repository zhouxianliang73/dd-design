/**
 * 五金 SKU 合并：完全重复行去重 + 同名多规格合并为 variants
 */
const { syncMiniprogramData } = require('./sync-miniprogram');

function norm(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function idRank(id) {
  if (/^k-hw-\d{3}$/.test(id)) return 0;
  if (/^k-hw-\d+$/.test(id)) return 1;
  return 2;
}

function pickCanonicalId(items) {
  return items.slice().sort(function (a, b) {
    const ra = idRank(a.id);
    const rb = idRank(b.id);
    if (ra !== rb) return ra - rb;
    return a.id.localeCompare(b.id);
  })[0].id;
}

function collectSourceRefs(item) {
  const refs = [];
  if (item.meta && item.meta.sourceRef) refs.push(String(item.meta.sourceRef));
  if (item.meta && Array.isArray(item.meta.sourceRefs)) {
    item.meta.sourceRefs.forEach(function (r) { refs.push(String(r)); });
  }
  return refs.filter(Boolean);
}

function mergeExactDuplicates(products) {
  const hw = products.filter(function (p) { return p.id.indexOf('k-hw') === 0; });
  const other = products.filter(function (p) { return p.id.indexOf('k-hw') !== 0; });
  const groups = {};

  hw.forEach(function (p) {
    const key = norm(p.name) + '|' + norm(p.spec) + '|' + String(p.price);
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const merged = [];
  let removed = 0;

  Object.keys(groups).forEach(function (key) {
    const items = groups[key];
    if (items.length === 1) {
      merged.push(items[0]);
      return;
    }

    const keep = items.slice().sort(function (a, b) { return idRank(a.id) - idRank(b.id); })[0];
    const refs = [];
    items.forEach(function (item) {
      collectSourceRefs(item).forEach(function (r) {
        if (refs.indexOf(r) < 0) refs.push(r);
      });
    });

    keep.meta = Object.assign({}, keep.meta || {}, {
      sourceRef: refs[0] || keep.meta && keep.meta.sourceRef,
      sourceRefs: refs,
      mergedExact: items.map(function (i) { return i.id; }).filter(function (id) { return id !== keep.id; }),
    });
    merged.push(keep);
    removed += items.length - 1;
  });

  return { products: other.concat(merged), removedExact: removed };
}

function toVariant(item) {
  return {
    id: item.id,
    sourceRef: item.meta && item.meta.sourceRef,
    spec: item.spec || '',
    price: item.price,
    unit: item.unit || '个',
    unitPrice: item.unitPrice != null ? item.unitPrice : item.price,
    techParams: item.techParams || '',
  };
}

function shortSpecLabel(spec) {
  const s = String(spec || '');
  const hole = s.match(/孔距[^，,\n]+(?:，长度[^，,\n]+)?/);
  if (hole) return hole[0];
  const len = s.match(/标称长度\d+mm/);
  if (len) return len[0];
  const dim = s.match(/\d+\*\d+\*\d+mm[^，]*/);
  if (dim) return dim[0];
  const part = s.split(' · ').pop() || s;
  return part.length > 36 ? part.slice(0, 36) + '…' : part;
}

function mergeNameVariants(products) {
  const hw = products.filter(function (p) { return p.id.indexOf('k-hw') === 0; });
  const other = products.filter(function (p) { return p.id.indexOf('k-hw') !== 0; });
  const groups = {};

  hw.forEach(function (p) {
    const key = norm(p.name);
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const merged = [];
  let removed = 0;
  let variantGroups = 0;

  Object.keys(groups).forEach(function (name) {
    const items = groups[name];
    if (items.length === 1) {
      merged.push(items[0]);
      return;
    }

    variantGroups += 1;
    const keepId = pickCanonicalId(items);
    const keep = items.find(function (p) { return p.id === keepId; });
    const variants = items.map(toVariant).sort(function (a, b) { return a.price - b.price; });
    const minPrice = variants[0].price;

    const parent = Object.assign({}, keep);
    parent.price = minPrice;
    parent.unitPrice = minPrice;
    parent.spec = (keep.techParams || keep.meta && keep.meta.hardwareGroup || '功能配件')
      + ' · 共' + variants.length + '种规格';
    parent.meta = Object.assign({}, keep.meta || {}, {
      variants: variants,
      mergedIds: items.map(function (i) { return i.id; }).filter(function (id) { return id !== keepId; }),
      importSource: 'hardware-merged',
    });

    const allRefs = [];
    variants.forEach(function (v) {
      if (v.sourceRef && allRefs.indexOf(v.sourceRef) < 0) allRefs.push(v.sourceRef);
    });
    if (allRefs.length) {
      parent.meta.sourceRef = allRefs[0];
      parent.meta.sourceRefs = allRefs;
    }

    merged.push(parent);
    removed += items.length - 1;
  });

  return {
    products: other.concat(merged),
    removedVariants: removed,
    variantGroups: variantGroups,
  };
}

function mergeHardwareCatalog(catalog) {
  const step1 = mergeExactDuplicates(catalog.products || []);
  const step2 = mergeNameVariants(step1.products);

  catalog.products = step2.products;
  catalog.updatedAt = new Date().toISOString().slice(0, 10);

  const hwCount = step2.products.filter(function (p) { return p.id.indexOf('k-hw') === 0; }).length;

  return {
    catalog: catalog,
    stats: {
      removedExact: step1.removedExact,
      removedVariants: step2.removedVariants,
      variantGroups: step2.variantGroups,
      hardwareTotal: hwCount,
    },
  };
}

module.exports = {
  mergeHardwareCatalog,
  mergeExactDuplicates,
  mergeNameVariants,
  shortSpecLabel,
};
