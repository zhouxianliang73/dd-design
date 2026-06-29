/**
 * 解析供应商询价 Excel（多表格式）→ 统一 inquiry-bundle 结构
 * 不含跨供应商比价矩阵，仅各供应商独立报价单。
 */
const XLSX = require('xlsx');

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v) {
  if (v == null) return '';
  return String(v).replace(/\r\n/g, '\n').trim();
}

function isHeaderRowGangpengda(row) {
  const first = str(row[0]);
  return first === '序号' || first.indexOf('购销清单') >= 0;
}

function parseGangpengdaSheet(sheet) {
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const lines = [];
  let leadTimeDays = '';
  let validDays = '';
  let total = 0;

  raw.forEach(function (row) {
    const c0 = str(row[0]);
    if (c0 === '生产工期：') leadTimeDays = str(row[1]);
    if (str(row[3]) === '报价有效期：') validDays = str(row[6]);
    if (isHeaderRowGangpengda(row)) return;
    if (!c0 || c0.indexOf('总价') >= 0 || c0 === '生产工期：') return;
    const seq = num(c0);
    if (seq == null) return;

    const amount = num(row[8]);
    if (amount) total += amount;

    lines.push({
      lineNo: seq,
      name: str(row[1]),
      image: str(row[2]),
      spec: str(row[3]),
      process: str(row[4]),
      qty: num(row[5]),
      areaSqm: num(row[6]),
      unitPrice: num(row[7]),
      amount: amount,
      notes: str(row[9])
    });
  });

  return {
    id: 'gangpengda',
    name: '钢鹏达金属制品',
    sheetName: '钢鹏达金属制品',
    currency: 'CNY',
    leadTimeDays: leadTimeDays,
    validDays: validDays,
    total: total || null,
    lines: lines
  };
}

function parseXinmaoSheet(sheet) {
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const textBlocks = [];
  raw.forEach(function (row) {
    row.forEach(function (cell) {
      const t = str(cell);
      if (t && t.length > 8) textBlocks.push(t);
    });
  });
  const fullText = textBlocks.join('\n');
  const priceMatch = fullText.match(/(\d+(?:\.\d+)?)\s*元/);
  const total = priceMatch ? num(priceMatch[1]) : null;

  return {
    id: 'xinmao',
    name: '鑫茂不锈钢定制',
    sheetName: '鑫茂不锈钢定制',
    currency: 'CNY',
    leadTimeDays: '',
    validDays: '',
    total: total,
    freeText: fullText,
    lines: total
      ? [
          {
            lineNo: 1,
            name: '304# 5.0层板架',
            spec: fullText.split('\n')[0].slice(0, 80),
            process: '',
            qty: 1,
            unitPrice: total,
            amount: total,
            notes: fullText
          }
        ]
      : []
  };
}

function parseBahengdaSheet(sheet) {
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  let clientName = '';
  let productName = '';
  let quoteDate = '';
  const lines = [];
  let total = null;

  raw.forEach(function (row, index) {
    const label = str(row[1]);
    if (label === '客户名称') clientName = str(row[2]);
    if (label === '产品名称') productName = str(row[2]);
    if (str(row[10]).indexOf('日期') >= 0) quoteDate = str(row[10]).replace(/^日期：?/, '');

    if (str(row[0]) === '序号') return;
    const seq = num(row[0]);
    if (seq == null) return;

    const name = str(row[1]);
    if (name === '小计：' || name.indexOf('小计') >= 0) {
      total = num(row[9]) || num(row[10]);
      return;
    }
    if (!name && !str(row[3])) return;

    lines.push({
      lineNo: seq,
      name: name || str(row[3]),
      bodyColor: str(row[2]),
      glassColor: str(row[3]),
      heightMm: num(row[4]),
      widthMm: num(row[5]),
      depthMm: num(row[6]),
      qty: num(row[7]),
      areaSqm: num(row[8]),
      unitPrice: num(row[9]),
      amount: num(row[10]),
      notes: str(row[11]),
      spec: [str(row[4]), str(row[5]), str(row[6])].filter(Boolean).join('×') + ' mm'
    });
  });

  return {
    id: 'bahengda',
    name: '堡亨达智能极简家居',
    sheetName: '堡亨达智能极简家居',
    currency: 'CNY',
    clientName: clientName,
    productName: productName,
    quoteDate: quoteDate,
    total: total,
    lines: lines.filter(function (l) { return l.name; })
  };
}

function parseInquiryWorkbook(workbook) {
  const suppliers = [];
  const sheetNames = workbook.SheetNames || [];

  sheetNames.forEach(function (name) {
    const sheet = workbook.Sheets[name];
    if (!sheet) return;
    if (name.indexOf('钢鹏达') >= 0) {
      suppliers.push(parseGangpengdaSheet(sheet));
    } else if (name.indexOf('鑫茂') >= 0) {
      suppliers.push(parseXinmaoSheet(sheet));
    } else if (name.indexOf('堡亨达') >= 0) {
      suppliers.push(parseBahengdaSheet(sheet));
    }
  });

  return suppliers;
}

function buildCommFromBundle(client, productName, suppliers) {
  const items = [
    { text: '客户：' + client + ' · 产品：' + productName, status: 'confirmed', role: 'team' },
    { text: '询价来源：微信/WhatsApp 供应商报价 Excel', status: 'confirmed', role: 'team' }
  ];

  suppliers.forEach(function (s) {
    const total = s.total != null ? '¥' + Number(s.total).toLocaleString('zh-CN') : '待核';
    items.push({
      text: '【供应商】' + s.name + ' 报价合计 ' + total,
      status: 'pending',
      role: 'supplier'
    });
  });

  return {
    commImagesSummary: '报价单来自聊天附件 Excel，图片示意列待设计稿/现场图补齐',
    commImages: [],
    commContentByDate: [
      {
        date: new Date().toISOString().slice(0, 10),
        items: items
      }
    ],
    schemeVersions: [
      {
        version: 'V1',
        date: suppliers[0] && suppliers[0].quoteDate || '',
        summary: productName + ' · 初版询价整理（Excel 自动导入）',
        images: []
      }
    ]
  };
}

function buildInquiryBundle(workbook, options) {
  const opts = options || {};
  const suppliers = parseInquiryWorkbook(workbook);
  const client = opts.client || (suppliers.find(function (s) { return s.clientName; }) || {}).clientName || '直泰';
  const productName = opts.productName || (suppliers.find(function (s) { return s.productName; }) || {}).productName || '不锈钢书柜';

  suppliers.forEach(function (s) {
    if (s.total != null) {
      s.totalText = '¥' + Number(s.total).toLocaleString('zh-CN');
    }
  });

  return {
    version: 1,
    slug: opts.slug || 'stainless-bookcase',
    name: productName + ' · 询价',
    client: client,
    productName: productName,
    channel: opts.channel || 'custom',
    projectType: opts.projectType || '不锈钢定制',
    status: 'inquiry',
    statusLabel: '询价',
    updatedAt: new Date().toISOString().slice(0, 10),
    sourceFile: opts.sourceFile || '',
    comm: buildCommFromBundle(client, productName, suppliers),
    suppliers: suppliers,
    suggestedCatalog: {
      id: 'f-bookcase-001',
      name: productName,
      space: '不锈钢家具',
      sub: '书柜',
      style: '现代',
      spec: '3000×2480×360',
      material: '不锈钢#304',
      notes: '由询价 Excel 自动生成草稿，审核后写入 catalog.json'
    }
  };
}

function readInquiryExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  return buildInquiryBundle(workbook, { sourceFile: filePath.split(/[/\\]/).pop() });
}

module.exports = {
  readInquiryExcel,
  buildInquiryBundle,
  parseInquiryWorkbook
};
