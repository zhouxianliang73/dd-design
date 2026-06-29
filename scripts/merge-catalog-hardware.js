/**
 * 合并 catalog.json 中五金 SKU 重复项
 *   npm run content:merge-hardware
 */
const fs = require('fs');
const path = require('path');
const { mergeHardwareCatalog } = require('./lib/merge-hardware-duplicates');
const { syncMiniprogramData } = require('./lib/sync-miniprogram');

const root = path.join(__dirname, '..');
const catalogPath = path.join(root, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const before = (catalog.products || []).filter(function (p) { return p.id.indexOf('k-hw') === 0; }).length;

const result = mergeHardwareCatalog(catalog);
fs.writeFileSync(catalogPath, JSON.stringify(result.catalog, null, 2) + '\n', 'utf8');
syncMiniprogramData(root);

console.log('五金 SKU 合并完成');
console.log('  合并前', before, '条 → 合并后', result.stats.hardwareTotal, '条');
console.log('  完全重复去除', result.stats.removedExact, '条');
console.log('  同名多规格合并', result.stats.variantGroups, '组，减少', result.stats.removedVariants, '条');
console.log('  已 sync miniprogram/data');
