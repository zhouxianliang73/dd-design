/**
 * 将 inquiry-bundle 写入 projects/ 与 miniprogram/data/
 */
const fs = require('fs');
const path = require('path');

function writeInquiryBundle(bundle, root) {
  const slug = bundle.slug;
  if (!slug) throw new Error('bundle.slug required');

  const projectDir = path.join(root, 'projects', slug);
  const quotesDir = path.join(projectDir, 'quotes');

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }
  if (!fs.existsSync(quotesDir)) {
    fs.mkdirSync(quotesDir, { recursive: true });
  }

  const projectJson = {
    version: 1,
    slug: slug,
    name: bundle.name,
    client: bundle.client,
    projectType: bundle.projectType,
    channel: bundle.channel || 'custom',
    quoteTemplate: 'default',
    status: bundle.statusLabel || '询价',
    sources: [
      {
        channel: bundle.channel || 'intake',
        note: '供应商报价：' + (bundle.sourceFile || slug)
      }
    ],
    suppliers: (bundle.suppliers || []).map(function (s) {
      return { id: s.id, name: s.name, quoteStatus: s.total ? '已报价' : '待核' };
    }),
    updatedAt: bundle.updatedAt,
    notes: '询价数据见 inquiry-bundle.json'
  };

  fs.writeFileSync(path.join(projectDir, 'project.json'), JSON.stringify(projectJson, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(projectDir, 'inquiry-bundle.json'), JSON.stringify(bundle, null, 2) + '\n', 'utf8');
  if (bundle.comm) {
    fs.writeFileSync(path.join(projectDir, 'comm-summary.json'), JSON.stringify(bundle.comm, null, 2) + '\n', 'utf8');
  }

  (bundle.suppliers || []).forEach(function (s) {
    fs.writeFileSync(path.join(quotesDir, s.id + '.json'), JSON.stringify(s, null, 2) + '\n', 'utf8');
  });

  const mpDataDir = path.join(root, 'miniprogram', 'data');
  if (!fs.existsSync(mpDataDir)) {
    fs.mkdirSync(mpDataDir, { recursive: true });
  }
  const mpOut = path.join(mpDataDir, 'inquiry-' + slug + '.js');
  fs.writeFileSync(mpOut, 'module.exports = ' + JSON.stringify(bundle) + ';\n', 'utf8');

  return { projectDir, mpOut };
}

module.exports = { writeInquiryBundle };
