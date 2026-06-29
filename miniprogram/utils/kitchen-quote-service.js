var catalogLite = require('../data/catalog-lite.js');

var KITCHEN_DEMO_LINE_IDS = {
  cabinet: ['k-cab-001', 'k-cab-002', 'k-cab-003', 'k-cab-004', 'k-cab-005', 'k-cab-006'],
  countertop: ['k-ct-001'],
  panel: ['k-pn-001', 'k-pn-002'],
  trim: ['k-tr-001', 'k-tr-002'],
  hardware: ['k-hw-001', 'k-hw-002', 'k-hw-003', 'k-hw-004'],
  sink: ['k-sk-001', 'k-sk-002'],
  electric: ['k-el-001'],
  extra: ['k-ex-001']
};

function buildCatalogIndex() {
  var map = {};
  (catalogLite.products || []).forEach(function (item) {
    map[item.id] = item;
  });
  return map;
}

function catalogItemToKitchenLine(item) {
  if (!item) return null;
  var spec = item.spec || '—';
  var material = item.material || item.techParams || '—';
  return {
    name: item.name,
    emoji: item.emoji || '⚙️',
    spec: spec,
    material: material,
    qty: item.qty != null ? item.qty : 1,
    unit: item.unit || '个',
    unitPrice: item.unitPrice != null ? item.unitPrice : item.price != null ? item.price : 0,
    image: item.image || ''
  };
}

function buildKitchenLinesBySection(sectionId) {
  var ids = KITCHEN_DEMO_LINE_IDS[sectionId] || [];
  var index = buildCatalogIndex();
  return ids
    .map(function (id) {
      return catalogItemToKitchenLine(index[id]);
    })
    .filter(Boolean);
}

function getKitchenProductLines() {
  var lines = {};
  Object.keys(KITCHEN_DEMO_LINE_IDS).forEach(function (sectionId) {
    lines[sectionId] = buildKitchenLinesBySection(sectionId);
  });
  return lines;
}

module.exports = {
  KITCHEN_DEMO_LINE_IDS: KITCHEN_DEMO_LINE_IDS,
  buildKitchenLinesBySection: buildKitchenLinesBySection,
  getKitchenProductLines: getKitchenProductLines
};
