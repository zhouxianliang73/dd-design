/**
 * 扫描 projects/*/quotes/*.xlsx（intake 归档的报价），解析并同步小程序询价数据。
 * 用法：npm run intake:sync-quotes
 */
const fs = require('fs');
const path = require('path');
const { readInquiryExcel } = require('./lib/inquiry-excel-parser');
const { writeInquiryBundle } = require('./lib/write-inquiry-bundle');

const root = path.join(__dirname, '..');
const projectsDir = path.join(root, 'projects');

function slugify(text) {
  return String(text || 'item')
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function listQuoteExcels(projectDir) {
  const quotesDir = path.join(projectDir, 'quotes');
  if (!fs.existsSync(quotesDir)) return [];
  return fs
    .readdirSync(quotesDir)
    .filter(function (name) {
      const lower = name.toLowerCase();
      return lower.endsWith('.xlsx') || lower.endsWith('.xls');
    })
    .map(function (name) {
      return path.join(quotesDir, name);
    });
}

function mergeProcurementInquiry(projectJson, entry) {
  const list = Array.isArray(projectJson.procurementInquiries) ? projectJson.procurementInquiries.slice() : [];
  const idx = list.findIndex(function (item) {
    return item.slug === entry.slug || item.id === entry.id;
  });
  if (idx >= 0) {
    list[idx] = Object.assign({}, list[idx], entry);
  } else {
    list.push(entry);
  }
  projectJson.procurementInquiries = list;
  if (!projectJson.procurement) {
    projectJson.procurement = {
      status: 'draft',
      note: 'Intake 已导入报价，待管理员发布确认'
    };
  }
  projectJson.updatedAt = new Date().toISOString().slice(0, 10);
  return projectJson;
}

function syncProject(projectSlug) {
  const projectDir = path.join(projectsDir, projectSlug);
  const projectJsonPath = path.join(projectDir, 'project.json');
  if (!fs.existsSync(projectDir) || !fs.existsSync(projectJsonPath)) {
    return { slug: projectSlug, imported: 0, skipped: true };
  }

  const excels = listQuoteExcels(projectDir);
  if (!excels.length) {
    return { slug: projectSlug, imported: 0, skipped: true };
  }

  let projectJson = readJson(projectJsonPath);
  let imported = 0;

  excels.forEach(function (excelPath) {
    const fileName = path.basename(excelPath);
    const inquirySlug = projectSlug + '-' + slugify(path.basename(excelPath, path.extname(excelPath)));
    const bundle = readInquiryExcel(excelPath);
    bundle.slug = inquirySlug;
    bundle.sourceFile = fileName;

    const meta = writeInquiryBundle(bundle, root);
    const inquiryId = 'inq-' + inquirySlug;

    projectJson = mergeProcurementInquiry(projectJson, {
      id: inquiryId,
      slug: inquirySlug,
      productName: bundle.productName || bundle.name,
      sourceFile: fileName
    });

    console.log('[OK]', projectSlug, '←', fileName, '→', inquirySlug);
    console.log('     ', meta.mpOut);
    imported += 1;
  });

  writeJson(projectJsonPath, projectJson);
  return { slug: projectSlug, imported: imported };
}

function main() {
  if (!fs.existsSync(projectsDir)) {
    console.log('无 projects/ 目录');
    return;
  }

  const dirs = fs.readdirSync(projectsDir).filter(function (name) {
    return !name.startsWith('_') && fs.statSync(path.join(projectsDir, name)).isDirectory();
  });

  let total = 0;
  dirs.forEach(function (slug) {
    const result = syncProject(slug);
    if (result.imported) total += result.imported;
  });

  if (!total) {
    console.log('未发现 projects/*/quotes/*.xlsx，请先通过 intake 写入报价附件。');
  } else {
    console.log('共导入', total, '份报价 Excel。新 slug 将自动从 miniprogram/data/inquiry-*.js 加载。');
    console.log('管理员发布：将 project.json 中 procurement.status 设为 confirmed');
  }
}

main();
