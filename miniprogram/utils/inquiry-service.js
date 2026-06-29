/**
 * 询价数据：按 slug 加载，支持一项目多产品询价
 */
const SLUG = 'stainless-bookcase';
const TOKEN = 'demo-inquiry-bookcase';

const SLUG_LOADERS = {
  'stainless-bookcase': function () {
    return require('../data/inquiry-stainless-bookcase.js');
  },
  'kitchen-cabinet': function () {
    return require('../data/inquiry-kitchen-cabinet.js');
  }
};

function loadBundleBySlug(slug) {
  if (!slug) return null;
  var loader = SLUG_LOADERS[slug];
  if (loader) {
    try {
      return loader();
    } catch (e) {
      /* fall through */
    }
  }
  try {
    return require('../data/inquiry-' + slug + '.js');
  } catch (e) {
    return null;
  }
}

function loadBundle() {
  return loadBundleBySlug(SLUG);
}

function getInquiryDefs(project) {
  if (!project) return [];
  if (Array.isArray(project.procurementInquiries) && project.procurementInquiries.length) {
    return project.procurementInquiries.map(function (def, index) {
      return {
        id: def.id || def.slug || 'inq-' + index,
        slug: def.slug,
        productName: def.productName || ''
      };
    });
  }
  if (project.procurementInquirySlug) {
    return [
      {
        id: project.procurementInquirySlug,
        slug: project.procurementInquirySlug,
        productName: project.procurementProductName || ''
      }
    ];
  }
  return [];
}

function getDemoProjectMeta() {
  const bundle = loadBundle();
  if (!bundle) return null;
  return {
    token: TOKEN,
    clientName: bundle.client + ' · ' + bundle.productName + ' · 供应商比价',
    projectNo: 'DD-2026-INQ-001',
    status: 'inquiry',
    statusLabel: '询价',
    updatedAt: bundle.updatedAt,
    itemCount: bundle.suppliers ? bundle.suppliers.length : 0,
    selection: [],
    address: '询价整理 · 供应商报价归档',
    projectType: bundle.projectType,
    designer: '周楚轩',
    coverEmoji: '📚',
    progress: 42,
    inquirySlug: SLUG
  };
}

function formatPrice(value) {
  return '¥' + Number(value || 0).toLocaleString('zh-CN');
}

function decorateSupplierQuote(supplier) {
  if (!supplier) return null;
  const lines = (supplier.lines || [])
    .filter(function (line) {
      if (!line.name) return false;
      if (line.lineNo != null && line.lineNo < 1) return false;
      if (line.name.indexOf('客户单号') >= 0) return false;
      if (line.name === '客户名称' || line.name === '产品名称') return false;
      if (line.name === '成品出货' && !line.amount) return false;
      return true;
    })
    .map(function (line, idx) {
      const amount = line.amount != null ? line.amount : (line.unitPrice || 0) * (line.qty || 1);
      return Object.assign({}, line, {
        lineId: supplier.id + '-' + idx,
        lineTotalText: formatPrice(amount),
        unitPriceText: line.unitPrice != null ? formatPrice(line.unitPrice) : '—'
      });
    });
  return Object.assign({}, supplier, {
    lines: lines,
    totalText: supplier.totalText || (supplier.total != null ? formatPrice(supplier.total) : '待核')
  });
}

function buildComparison(suppliers) {
  const rows = (suppliers || []).map(function (s) {
    return {
      id: s.id,
      name: s.name,
      total: s.total,
      totalText: s.totalText || '待核',
      leadTimeDays: s.leadTimeDays || '—',
      validDays: s.validDays || '—',
      lineCount: (s.lines || []).length
    };
  });
  const priced = rows.filter(function (r) {
    return r.total != null && r.total > 0;
  });
  let minTotal = null;
  if (priced.length) {
    minTotal = priced.reduce(function (min, r) {
      return r.total < min ? r.total : min;
    }, priced[0].total);
  }
  rows.forEach(function (r) {
    r.isLowest = minTotal != null && r.total === minTotal;
  });
  return {
    rows: rows,
    minTotal: minTotal,
    minTotalText: minTotal != null ? formatPrice(minTotal) : '—',
    supplierCount: rows.length
  };
}

function getInquiryForProject(project) {
  if (!project || project.inquirySlug !== SLUG && project.token !== TOKEN) return null;
  return getInquiryBySlug(SLUG);
}

function getInquiryBySlug(slug) {
  const bundle = loadBundleBySlug(slug);
  if (!bundle) return null;
  const suppliers = (bundle.suppliers || []).map(decorateSupplierQuote);
  return {
    bundle: bundle,
    suppliers: suppliers,
    comparison: buildComparison(suppliers)
  };
}

function buildProcurementProduct(def) {
  if (!def || !def.slug) return null;
  const data = getInquiryBySlug(def.slug);
  if (!data) return null;
  const suppliers = data.suppliers || [];
  const bundle = data.bundle || {};
  const id = def.id || def.slug;
  return {
    id: id,
    slug: def.slug,
    productName: def.productName || bundle.productName || bundle.name || def.slug,
    supplierCount: suppliers.length,
    inquirySuppliers: suppliers,
    inquiryComparison: data.comparison,
    activeSupplierId: suppliers.length ? suppliers[0].id : ''
  };
}

function buildProcurementProducts(inquiryDefs) {
  return (inquiryDefs || []).map(buildProcurementProduct).filter(Boolean);
}

function getComm(bundle) {
  if (!bundle || !bundle.comm) return null;
  return bundle.comm;
}

module.exports = {
  SLUG: SLUG,
  TOKEN: TOKEN,
  loadBundle: loadBundle,
  loadBundleBySlug: loadBundleBySlug,
  getInquiryDefs: getInquiryDefs,
  getDemoProjectMeta: getDemoProjectMeta,
  getInquiryForProject: getInquiryForProject,
  getInquiryBySlug: getInquiryBySlug,
  buildProcurementProduct: buildProcurementProduct,
  buildProcurementProducts: buildProcurementProducts,
  decorateSupplierQuote: decorateSupplierQuote,
  buildComparison: buildComparison,
  getComm: getComm,
  formatPrice: formatPrice
};
