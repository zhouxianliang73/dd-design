var completedDisplay = require('./completed-project-display');

var LAYOUT_KEY = 'dd_project_layout_v3';

var SCHEME_STATUS_VALUES = ['scheme', 'inquiry'];
var SCHEME_STATUS_LABELS = ['方案', '询价', '设计中', '待确认'];

var DESIGNERS = ['张俊', '顾欣', '盛菲', '周楚轩', '周宏'];
var COVER_EMOJIS = ['🗄️', '🛋️', '🛏️', '🍽️', '📚', '🏡'];

var KITCHEN_IMAGES = [
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=96&h=96&fit=crop&auto=format&q=80'
];

var KITCHEN_DEMO_TOKEN = 'demo-kitchen-001';

var KITCHEN_SECTION_DEFS = [
  { id: 'cabinet', name: '柜体' },
  { id: 'countertop', name: '台面' },
  { id: 'panel', name: '见光板' },
  { id: 'trim', name: '地脚线/顶封板' },
  { id: 'hardware', name: '功能配件' },
  { id: 'sink', name: '水槽/龙头' },
  { id: 'electric', name: '电器' },
  { id: 'extra', name: '增加项目' }
];

var KITCHEN_PRODUCT_LINES = {
  cabinet: [
    {
      name: '洗手盘地柜',
      emoji: '🗄️',
      spec: '800×700×570',
      material: '大千云纹',
      qty: 1,
      unit: '米',
      unitPrice: 5627,
      image: KITCHEN_IMAGES[0]
    },
    {
      name: '地柜',
      emoji: '🗄️',
      spec: '800×700×570',
      material: '大千云纹',
      qty: 3.2,
      unit: '米',
      unitPrice: 5627,
      image: KITCHEN_IMAGES[1]
    },
    {
      name: '灶台吊柜',
      emoji: '🗄️',
      spec: '800×700×370',
      material: '大千云纹',
      qty: 0.9,
      unit: '米',
      unitPrice: 5077,
      image: KITCHEN_IMAGES[2]
    },
    {
      name: '吊柜',
      emoji: '🗄️',
      spec: '800×700×370',
      material: '大千云纹',
      qty: 2.4,
      unit: '米',
      unitPrice: 5077,
      image: KITCHEN_IMAGES[2]
    },
    {
      name: '高柜',
      emoji: '🗄️',
      spec: '600×2100×570',
      material: '大千云纹',
      qty: 1,
      unit: '米',
      unitPrice: 5908,
      image: KITCHEN_IMAGES[3]
    }
  ],
  countertop: [
    {
      name: '台面',
      emoji: '▬',
      spec: '琉晶-丝纹GY01 · 12mm',
      material: '琉晶-丝纹GY01',
      qty: 3,
      unit: '米',
      unitPrice: 1655,
      image: KITCHEN_IMAGES[3]
    }
  ],
  panel: [
    {
      name: '侧见光板',
      emoji: '📐',
      spec: '大千云纹',
      material: '大千云纹',
      qty: 1.5,
      unit: '㎡',
      unitPrice: 1598,
      image: KITCHEN_IMAGES[2]
    },
    {
      name: '高柜见光板',
      emoji: '📐',
      spec: '大千云纹',
      material: '大千云纹',
      qty: 1,
      unit: '㎡',
      unitPrice: 1598,
      image: KITCHEN_IMAGES[2]
    }
  ],
  trim: [
    {
      name: '地脚线',
      emoji: '📏',
      spec: '与柜体一致',
      material: '大千云纹',
      qty: 4.8,
      unit: '米',
      unitPrice: 268,
      image: KITCHEN_IMAGES[1]
    },
    {
      name: '顶封板',
      emoji: '📏',
      spec: '与柜体一致',
      material: '大千云纹',
      qty: 3.2,
      unit: '米',
      unitPrice: 268,
      image: KITCHEN_IMAGES[1]
    }
  ],
  hardware: [
    {
      name: '百隆铰链',
      emoji: '⚙️',
      spec: '全盖',
      material: '—',
      qty: 24,
      unit: '个',
      unitPrice: 38,
      image: KITCHEN_IMAGES[4]
    },
    {
      name: '希勒碗碟篮',
      emoji: '⚙️',
      spec: '600柜',
      material: '—',
      qty: 1,
      unit: '套',
      unitPrice: 680,
      image: KITCHEN_IMAGES[4]
    },
    {
      name: '百隆反弹器',
      emoji: '⚙️',
      spec: '按柜门',
      material: '—',
      qty: 12,
      unit: '个',
      unitPrice: 28,
      image: KITCHEN_IMAGES[4]
    }
  ],
  sink: [
    {
      name: '手工单槽',
      emoji: '🚰',
      spec: '680×450',
      material: '304不锈钢',
      qty: 1,
      unit: '个',
      unitPrice: 1280,
      image: KITCHEN_IMAGES[4]
    },
    {
      name: '抽拉龙头',
      emoji: '🚰',
      spec: '冷热',
      material: '不锈钢',
      qty: 1,
      unit: '个',
      unitPrice: 560,
      image: KITCHEN_IMAGES[4]
    }
  ],
  electric: [
    {
      name: '蒸烤一体机',
      emoji: '🔌',
      spec: '嵌入位预留',
      material: '—',
      qty: 1,
      unit: '台',
      unitPrice: 0,
      image: KITCHEN_IMAGES[0]
    }
  ],
  extra: [
    {
      name: '安装费',
      emoji: '➕',
      spec: '含现场安装',
      material: '—',
      qty: 1,
      unit: '项',
      unitPrice: 2800,
      image: KITCHEN_IMAGES[1]
    }
  ]
};

var KITCHEN_COMM = {
  commImagesSummary: '共 5 张厨房现场与参考图，L 型布局，不锈钢柜体 + 琉晶台面',
  commImages: [
    { url: KITCHEN_IMAGES[0], note: 'L型布局参考' },
    { url: KITCHEN_IMAGES[1], note: '高柜与电器位' },
    { url: KITCHEN_IMAGES[2], note: '大千云纹门板' },
    { url: KITCHEN_IMAGES[3], note: '台面琉晶丝纹' },
    { url: KITCHEN_IMAGES[4], note: '水槽与龙头位置' }
  ],
  commContentByDate: [
    {
      date: '2026-06-20',
      items: [
        { text: '偏好大千云纹系列，台面琉晶-丝纹 GY01', status: 'confirmed' },
        { text: '水槽手工单槽 + 抽拉龙头', status: 'confirmed' },
        { text: '蒸烤一体机嵌入位尺寸待复核', status: 'pending' },
        { text: '预算 ¥7 万以内，交货期 45 天内', status: 'important' }
      ]
    },
    {
      date: '2026-06-18',
      items: [
        { text: 'L 型厨房布局，要求不锈钢柜体', status: 'confirmed' },
        { text: '需百隆五金 + 希勒碗碟篮', status: 'confirmed' }
      ]
    }
  ],
  schemeVersions: [
    {
      version: 'V1',
      date: '2026-06-22',
      summary: 'L 型厨柜方案 V1 · 柜体 + 琉晶台面 + 百隆五金 + 希勒碗碟篮，八类清单齐全',
      images: [
        { url: KITCHEN_IMAGES[0], note: '厨房整体效果图' },
        { url: KITCHEN_IMAGES[2], note: '柜体立面' }
      ]
    }
  ]
};

var SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=96&h=96&fit=crop&auto=format&q=80'
];

var DEMO_RAW = [
  {
    token: KITCHEN_DEMO_TOKEN,
    clientName: '陈先生 · 不锈钢厨柜',
    projectNo: 'DD-2026-06-22-018',
    status: 'scheme',
    statusLabel: '方案',
    updatedAt: '2026-06-22',
    itemCount: 18,
    selection: [],
    address: '东莞市南城区鸿福路 128 号 · 御景湾',
    projectType: '不锈钢橱柜',
    quoteTemplate: 'kitchen',
    designer: '李雅婷',
    coverEmoji: '🗄️',
    progress: 68
  },
  {
    token: 'demo-scheme-001',
    clientName: '张先生 · 客厅',
    projectNo: 'DD-DEMO-001',
    status: 'scheme',
    statusLabel: '方案',
    updatedAt: '2026-06-20',
    itemCount: 3,
    selection: [],
    address: '上海浦东新区 xxx 路 123 号',
    projectType: '全案设计',
    designer: '张俊',
    coverEmoji: '🛋️',
    progress: 45
  },
  {
    token: 'demo-scheme-003',
    clientName: '陈女士 · 餐厅',
    projectNo: 'DD-DEMO-003',
    status: 'inquiry',
    statusLabel: '询价',
    updatedAt: '2026-06-15',
    itemCount: 4,
    selection: [],
    address: '杭州西湖区 xxx 巷 6 号',
    projectType: '全案设计',
    designer: '顾欣',
    coverEmoji: '🍽️',
    progress: 38
  }
];

var DEMO_PRODUCTS = [
  [
    { name: '云朵沙发', emoji: '☁️', spec: '2.4m 三人位', material: '实木+布艺', qty: 1, unit: '个', unitPrice: 12000, image: SAMPLE_IMAGES[2] },
    { name: '岩板茶几', emoji: '🪨', spec: '1.2m', material: '岩板+金属', qty: 1, unit: '个', unitPrice: 4800, image: SAMPLE_IMAGES[0] },
    { name: '现代不锈钢餐椅', emoji: '🪑', spec: '标准款', material: '不锈钢+皮革', qty: 2, unit: '把', unitPrice: 1200, image: SAMPLE_IMAGES[1] }
  ],
  [
    { name: '美式实木大床', emoji: '🛏️', spec: '1.8m×2.0m', material: '实木', qty: 1, unit: '张', unitPrice: 18900, image: SAMPLE_IMAGES[0] },
    { name: '中古实木床头柜', emoji: '🛏️', spec: '0.5m×0.4m', material: '橡木', qty: 2, unit: '个', unitPrice: 2800, image: SAMPLE_IMAGES[1] }
  ],
  [
    { name: '悬浮餐桌', emoji: '🪄', spec: '1.6m', material: '实木+金属', qty: 1, unit: '张', unitPrice: 6200, image: SAMPLE_IMAGES[0] },
    { name: '现代不锈钢餐椅', emoji: '🪑', spec: '标准款', material: '布艺+金属', qty: 4, unit: '把', unitPrice: 1800, image: SAMPLE_IMAGES[2] },
    { name: '中古风餐边柜', emoji: '🗄️', spec: '1.5m', material: '实木+藤编', qty: 1, unit: '个', unitPrice: 6800, image: SAMPLE_IMAGES[1] }
  ]
];

var DEMO_COMM = [
  {
    commImagesSummary: '共 3 张客厅参考图，涵盖整体风格与软装偏好',
    commImages: [
      { url: SAMPLE_IMAGES[0], note: '客厅整体氛围' },
      { url: SAMPLE_IMAGES[1], note: '沙发款式偏好' },
      { url: SAMPLE_IMAGES[2], note: '浅灰色调参考' }
    ],
    commContentByDate: [
      {
        date: '2026-07-14',
        items: [
          { text: '浅灰布艺沙发，不要深色木饰面', status: 'confirmed' },
          { text: '茶几款式待选', status: 'pending' },
          { text: '预算控制在 ¥2 万以内', status: 'important' }
        ]
      },
      {
        date: '2026-07-08',
        items: [
          { text: '希望温暖明亮、整体偏北欧', status: 'confirmed' },
          { text: '注重耐用与易打理', status: 'confirmed' }
        ]
      }
    ],
    schemeVersions: [
      {
        version: 'V1',
        date: '2026-07-13',
        summary: '现代简约客厅布局，推荐 3 款沙发与 2 款茶几组合',
        images: [
          { url: SAMPLE_IMAGES[1], note: '初稿客厅效果图' },
          { url: SAMPLE_IMAGES[0], note: '调整后的电视墙' }
        ]
      }
    ]
  },
  {
    commImagesSummary: '共 2 张卧室参考图，偏北欧自然风',
    commImages: [
      { url: SAMPLE_IMAGES[0], note: '卧室整体' },
      { url: SAMPLE_IMAGES[2], note: '床品色调' }
    ],
    commContentByDate: [
      {
        date: '2026-07-12',
        items: [
          { text: '主卧要安静、收纳足够', status: 'confirmed' },
          { text: '床品偏亚麻色', status: 'confirmed' },
          { text: '8 月中旬前完成选型', status: 'important' }
        ]
      }
    ],
    schemeVersions: [
      {
        version: 'V1',
        date: '2026-07-11',
        summary: '实木床架 + 双床头柜，色调与客厅统一',
        images: [{ url: SAMPLE_IMAGES[0], note: '卧室效果图 V1' }]
      }
    ]
  },
  {
    commImagesSummary: '共 4 张餐厅参考图，含餐桌与餐椅款式',
    commImages: [
      { url: SAMPLE_IMAGES[2], note: '餐厅整体' },
      { url: SAMPLE_IMAGES[1], note: '餐桌款式' }
    ],
    commContentByDate: [
      {
        date: '2026-07-10',
        items: [
          { text: '餐桌要悬浮感，餐椅需易清洁', status: 'confirmed' },
          { text: '与客厅色调统一', status: 'pending' },
          { text: '偏好现代简约', status: 'important' }
        ]
      }
    ],
    schemeVersions: [
      {
        version: 'V1',
        date: '2026-07-09',
        summary: '悬浮餐桌 + 4 把餐椅，色调与客厅统一',
        images: [{ url: SAMPLE_IMAGES[1], note: '餐厅视角' }]
      }
    ]
  }
];

function normalizeCommContentByDate(comm) {
  if (!comm) return [];
  if (Array.isArray(comm.commContentByDate) && comm.commContentByDate.length) {
    return comm.commContentByDate;
  }
  if (Array.isArray(comm.clientFeedbackByDate) && comm.clientFeedbackByDate.length) {
    return comm.clientFeedbackByDate.map(function (entry) {
      if (entry.items && entry.items.length) return entry;
      var status = Number(entry.remindCount || 0) >= 2 ? 'important' : 'confirmed';
      return {
        date: entry.date,
        items: [{ text: entry.summary || '—', status: status }],
        images: entry.images
      };
    });
  }
  var brief = comm.clientFeedbackSummary || comm.clientSummary || '';
  if (!brief) return [];
  return [{ date: '', items: [{ text: brief, status: 'confirmed' }] }];
}

function normalizeSchemeVersions(comm) {
  if (!comm) return [];
  if (Array.isArray(comm.schemeVersions) && comm.schemeVersions.length) {
    return comm.schemeVersions;
  }
  if (comm.designerSummary || (comm.designerImages && comm.designerImages.length)) {
    return [
      {
        version: 'V1',
        date: '',
        summary: comm.designerSummary || '',
        images: comm.designerImages || []
      }
    ];
  }
  return [];
}

function normalizeComm(comm) {
  if (!comm) comm = {};
  return {
    commImagesSummary: comm.commImagesSummary || comm.clientUploadSummary || '',
    commImages: comm.commImages || comm.clientImages || [],
    commContentByDate: normalizeCommContentByDate(comm),
    schemeVersions: normalizeSchemeVersions(comm)
  };
}

function formatPrice(value) {
  return '¥' + Number(value || 0).toLocaleString('zh-CN');
}

function estimatePrice(project) {
  var base = 18000;
  var count = project.itemCount || 1;
  var hash = 0;
  var key = project.token || project.projectNo || '';
  for (var i = 0; i < key.length; i += 1) {
    hash += key.charCodeAt(i);
  }
  return base + count * 6200 + (hash % 5) * 1800;
}

function decorateProductLine(line, lineId) {
  var unitPrice = line.unitPrice || 0;
  var qty = line.qty || 1;
  var coef = line.coef || 1;
  var id = line.lineId || lineId || '';
  return Object.assign({}, line, {
    lineId: id,
    unitPriceText: formatPrice(unitPrice),
    lineTotalText: formatPrice(unitPrice * qty * coef)
  });
}

function isLineRemoved(removedIds, lineId) {
  if (!lineId || !removedIds || !removedIds.length) return false;
  return removedIds.indexOf(lineId) >= 0;
}

function buildKitchenQuoteCategories(project) {
  var removed = project && project.removedQuoteLineIds ? project.removedQuoteLineIds : [];
  return KITCHEN_SECTION_DEFS.map(function (sec) {
    var products = (KITCHEN_PRODUCT_LINES[sec.id] || [])
      .map(function (line, idx) {
        return decorateProductLine(line, sec.id + '-' + idx);
      })
      .filter(function (line) {
        return !isLineRemoved(removed, line.lineId);
      });
    return {
      id: sec.id,
      name: sec.name,
      products: products,
      subtotalText: formatPrice(sumCategoryProducts(products))
    };
  });
}

function isKitchenProject(project) {
  if (!project) return false;
  if (project.token === KITCHEN_DEMO_TOKEN) return true;
  var type = project.projectType || '';
  return type.indexOf('不锈钢橱柜') >= 0 || type.indexOf('不锈钢厨柜') >= 0 || project.quoteTemplate === 'kitchen';
}

function sumCategoryProducts(products) {
  return (products || []).reduce(function (sum, line) {
    return sum + (line.unitPrice || 0) * (line.qty || 1) * (line.coef || 1);
  }, 0);
}

function sumQuoteCategories(categories) {
  return (categories || []).reduce(function (sum, cat) {
    return sum + sumCategoryProducts(cat.products);
  }, 0);
}

function productsFromSelection(selection) {
  if (!selection || !selection.length) return [];
  return selection.map(function (line, idx) {
    return decorateProductLine({
      name: line.name || line.catalogId || '产品',
      emoji: '📦',
      spec: line.spec || '—',
      material: line.material || '—',
      qty: line.qty || 1,
      unit: line.unit || '件',
      unitPrice: line.unitPrice || 3000 + idx * 500,
      image: line.image || SAMPLE_IMAGES[idx % SAMPLE_IMAGES.length]
    }, 'sel-' + idx);
  });
}

function filterRemovedProducts(products, removedIds) {
  return (products || []).filter(function (line) {
    return !isLineRemoved(removedIds, line.lineId);
  });
}

function buildCommFromMeta(project, index) {
  var brief =
    (project.meta && project.meta.brief) ||
    (project.comm_summary && project.comm_summary.clientBrief) ||
    '已提交设计需求，等待设计师回复。';
  var demo = DEMO_COMM[index % DEMO_COMM.length];
  var comm = normalizeComm({
    commImagesSummary: demo.commImagesSummary,
    commImages: demo.commImages,
    commContentByDate: [
      {
        date: new Date().toISOString().slice(0, 10),
        items: [{ text: brief.length > 120 ? brief.slice(0, 120) + '…' : brief, status: 'pending' }]
      }
    ],
    schemeVersions: [
      {
        version: 'V1',
        date: '',
        summary: (project.meta && project.meta.summary) || (demo.schemeVersions[0] && demo.schemeVersions[0].summary) || '方案整理中',
        images: (demo.schemeVersions[0] && demo.schemeVersions[0].images) || []
      }
    ]
  });
  return comm;
}

function normalizeSectionOpen(sectionOpen, quoteCategories) {
  var o = sectionOpen || {};
  var base = {
    products: o.products || false,
    commImages: o.commImages || o.clientImages || false,
    commContent: o.commContent || o.clientFeedback || false,
    schemeVersions: o.schemeVersions || o.designerSummary || false
  };
  if (quoteCategories && quoteCategories.length) {
    quoteCategories.forEach(function (cat) {
      base[cat.id] = o[cat.id] || false;
    });
  }
  return base;
}

function defaultSectionOpen() {
  return {
    products: false,
    commImages: false,
    commContent: false,
    schemeVersions: false
  };
}

function attachProjectContent(project, index) {
  var isDemo = String(project.token || '').indexOf('demo-') === 0;
  var isKitchen = isKitchenProject(project);
  var removedIds = project.removedQuoteLineIds || [];
  var quoteCategories = isKitchen ? buildKitchenQuoteCategories(project) : null;
  var products = productsFromSelection(project.selection);
  if (!products.length && !quoteCategories) {
    products = (DEMO_PRODUCTS[index % DEMO_PRODUCTS.length] || DEMO_PRODUCTS[0]).map(function (line, idx) {
      return decorateProductLine(line, 'demo-' + index + '-' + idx);
    });
  }
  products = filterRemovedProducts(products, removedIds);

  var comm;
  if (isKitchen) {
    comm = normalizeComm(KITCHEN_COMM);
  } else if (isDemo) {
    comm = normalizeComm(DEMO_COMM[index % DEMO_COMM.length]);
  } else {
    comm = normalizeComm(Object.assign({}, buildCommFromMeta(project, index), project.comm || {}));
  }

  var priceFromProducts = quoteCategories
    ? sumQuoteCategories(quoteCategories)
    : products.reduce(function (sum, line) {
        return sum + (line.unitPrice || 0) * (line.qty || 1) * (line.coef || 1);
      }, 0);

  var enriched = Object.assign({}, project, {
    address: project.address || (project.meta && project.meta.address) || '项目地址待填写',
    projectType: project.projectType || '全案设计',
    showConfirm:
      SCHEME_STATUS_LABELS.indexOf(project.statusLabel || '') >= 0 ||
      SCHEME_STATUS_VALUES.indexOf(project.status || '') >= 0,
    showDelivery: false,
    phase: 'scheme',
    canEditQuote: true,
    expanded: false,
    sectionOpen: normalizeSectionOpen(project.sectionOpen, quoteCategories),
    products: products,
    quoteCategories: quoteCategories,
    comm: comm,
    price:
      isKitchen || (project.price != null && !isDemo && project.selection && project.selection.length)
        ? priceFromProducts
        : project.price || priceFromProducts || estimatePrice(project)
  });

  enriched.priceText = formatPrice(enriched.price);

  if (enriched.isMerged && enriched.children && enriched.children.length) {
    enriched.children = enriched.children.map(function (child, childIndex) {
      return attachProjectContent(child, childIndex);
    });
  }

  return enriched;
}

function enrichProject(project, index) {
  var price = project.price != null ? project.price : estimatePrice(project);
  var base = Object.assign({}, project, {
    id: project.id || project.token,
    selected: !!project.selected,
    designer: project.designer || DESIGNERS[index % DESIGNERS.length],
    price: price,
    priceText: formatPrice(price),
    progress: project.progress != null ? project.progress : Math.min(88, 22 + (project.itemCount || 1) * 16),
    coverEmoji: project.coverEmoji || COVER_EMOJIS[index % COVER_EMOJIS.length],
    isMerged: !!project.isMerged,
    childrenCount: project.children ? project.children.length : project.childrenCount || 0,
    children: project.children || []
  });
  return attachProjectContent(base, index);
}

function readLayout() {
  try {
    var layout = wx.getStorageSync(LAYOUT_KEY);
    return layout && Array.isArray(layout.items) ? layout : { items: null };
  } catch (e) {
    return { items: null };
  }
}

function writeLayout(items) {
  wx.setStorageSync(LAYOUT_KEY, {
    items: items.map(stripRuntimeFields),
    savedAt: Date.now()
  });
}

function stripRuntimeFields(item) {
  var copy = Object.assign({}, item, { selected: false, expanded: false });
  if (copy.children && copy.children.length) {
    copy.children = copy.children.map(stripRuntimeFields);
  }
  return copy;
}

function isCompletedProject(project) {
  return completedDisplay.isCompletedProject(project);
}

function isSchemeProject(project) {
  if (!project || isCompletedProject(project)) return false;
  var token = String(project.token || '');
  if (token.indexOf('demo-completed') === 0) return false;
  if (token.indexOf('demo-') === 0) return true;
  if (SCHEME_STATUS_VALUES.indexOf(project.status || '') >= 0) return true;
  if (SCHEME_STATUS_LABELS.indexOf(project.statusLabel || '') >= 0) return true;
  return false;
}

function stripNonKitchenDemos(projects) {
  return (projects || []).filter(function (p) {
    return isSchemeProject(p);
  });
}

function withDemoProjects(rawProjects) {
  var list = (rawProjects || []).filter(function (p) {
    return !isCompletedProject(p);
  });
  DEMO_RAW.forEach(function (demo) {
    if (!list.some(function (p) { return p.token === demo.token; })) {
      list.push(Object.assign({}, demo));
    }
  });
  return list.filter(isSchemeProject);
}

function ensureKitchenDemo(projects) {
  if (!projects || !projects.length) return projects;
  var hasKitchen = projects.some(function (p) {
    return isKitchenProject(p);
  });
  if (hasKitchen) return projects;
  var kitchenRaw = DEMO_RAW.find(function (d) { return d.token === KITCHEN_DEMO_TOKEN; });
  if (!kitchenRaw) return projects;
  return [enrichProject(Object.assign({}, kitchenRaw), 0)].concat(projects);
}

function filterSchemeProjects(projects) {
  return (projects || []).filter(function (p) {
    return isSchemeProject(p) && !p.parentId;
  });
}

function buildDisplayProjects(rawProjects) {
  var layout = readLayout();
  var list;
  if (layout.items && layout.items.length) {
    list = stripNonKitchenDemos(
      layout.items.map(function (item, index) {
        return enrichProject(item, index);
      })
    );
    list = ensureKitchenDemo(list);
    writeLayout(list);
  } else {
    list = withDemoProjects(rawProjects).map(function (item, index) {
      return enrichProject(item, index);
    });
    writeLayout(list);
  }
  return collapseAllShells(list);
}

function collapseAllShells(projects) {
  return mapProjectsDeep(projects, function (p) {
    return Object.assign({}, p, { expanded: false });
  });
}

function suggestMergedName(selected) {
  var first = selected[0] && selected[0].clientName ? selected[0].clientName.split(' · ')[0] : '合并';
  return first + ' · 合并方案 (' + selected.length + '项)';
}

function computeSelection(projects) {
  var selected = projects.filter(function (p) {
    return p.selected;
  });
  var total = selected.reduce(function (sum, p) {
    return sum + (p.price || 0);
  }, 0);
  var canSplit = selected.length === 1 && selected[0].isMerged && selected[0].children.length;
  var canMerge = selected.length >= 2;

  var mergeHintMeta = '勾选 2 个及以上方案后可合并';
  var showMergeName = false;
  var mergeHintSubs = '';
  var mergeBtnLabel = '合并方案';
  var mergeHintVisible = selected.length > 0;

  if (canSplit) {
    mergeHintMeta =
      '合并方案 · 含 ' + selected[0].children.length + ' 个子方案 · 合计 ' + formatPrice(selected[0].price);
    mergeHintSubs = selected[0].children
      .map(function (c) {
        return c.clientName;
      })
      .join('、');
    mergeBtnLabel = '拆分方案';
  } else if (canMerge) {
    mergeHintMeta = '将合并 ' + selected.length + ' 个项目 · 合计 ' + formatPrice(total);
    mergeHintSubs = selected
      .map(function (p) {
        return p.clientName;
      })
      .join('、');
    showMergeName = true;
  } else if (selected.length === 1) {
    mergeHintMeta = '至少再勾选 1 个方案，或勾选已合并方案后可拆分';
  }

  return {
    selectedCount: selected.length,
    selectedTotal: total,
    selectedTotalText: formatPrice(total),
    selectAll: projects.length > 0 && selected.length === projects.length,
    canMerge: canMerge || canSplit,
    canSplit: canSplit,
    mergeBtnLabel: mergeBtnLabel,
    mergeHintVisible: mergeHintVisible,
    mergeHintMeta: mergeHintMeta,
    mergeHintSubs: mergeHintSubs,
    showMergeName: showMergeName,
    suggestedMergeName: canMerge ? suggestMergedName(selected) : ''
  };
}

function applySelection(projects, patch) {
  var next = projects.map(function (p) {
    return Object.assign({}, p, patch(p));
  });
  writeLayout(next);
  return next;
}

function toggleSelectAll(projects, checked) {
  return applySelection(projects, function () {
    return { selected: checked };
  });
}

function toggleSelect(projects, id) {
  return applySelection(projects, function (p) {
    if (p.id !== id) return {};
    return { selected: !p.selected };
  });
}

function mapProjectsDeep(projects, fn) {
  return projects.map(function (p) {
    var next = fn(p);
    if (next.children && next.children.length) {
      next.children = mapProjectsDeep(next.children, fn);
    }
    return next;
  });
}

function toggleShellExpand(projects, id) {
  return mapProjectsDeep(projects, function (p) {
    if (p.id !== id) return p;
    return Object.assign({}, p, { expanded: !p.expanded });
  });
}

function toggleSection(projects, id, sectionKey) {
  return mapProjectsDeep(projects, function (p) {
    if (p.id !== id) return p;
    var sectionOpen = Object.assign({}, p.sectionOpen || defaultSectionOpen());
    sectionOpen[sectionKey] = !sectionOpen[sectionKey];
    return Object.assign({}, p, { sectionOpen: sectionOpen, expanded: true });
  });
}

function mergeSelected(projects, mergeName) {
  var selected = projects.filter(function (p) {
    return p.selected;
  });

  if (selected.length === 1 && selected[0].isMerged) {
    return splitMerged(projects, selected[0].id);
  }

  if (selected.length < 2) return null;

  var total = selected.reduce(function (sum, p) {
    return sum + (p.price || 0);
  }, 0);
  var mergedId = 'merged-' + Date.now();
  var children = selected.map(function (p) {
    return Object.assign({}, p, { selected: false, expanded: false });
  });

  var merged = enrichProject(
    {
      id: mergedId,
      token: mergedId,
      clientName: mergeName || suggestMergedName(selected),
      projectNo: 'MERGE-' + String(Date.now()).slice(-6),
      status: 'scheme',
      statusLabel: '方案',
      updatedAt: new Date().toISOString().slice(0, 10),
      itemCount: selected.reduce(function (sum, p) {
        return sum + (p.itemCount || 0);
      }, 0),
      designer: selected[0].designer,
      price: total,
      isMerged: true,
      children: children,
      selection: []
    },
    0
  );

  var remaining = projects
    .filter(function (p) {
      return !p.selected;
    })
    .map(function (p, index) {
      return enrichProject(Object.assign({}, p, { selected: false }), index);
    });

  remaining.unshift(merged);
  writeLayout(remaining);
  return remaining;
}

function splitMerged(projects, mergedId) {
  var index = -1;
  for (var i = 0; i < projects.length; i += 1) {
    if (projects[i].id === mergedId) index = i;
  }
  if (index < 0) return projects;

  var merged = projects[index];
  if (!merged.isMerged || !merged.children.length) return projects;

  var restored = merged.children.map(function (child, childIndex) {
    return enrichProject(Object.assign({}, child, { selected: false, expanded: false }), childIndex);
  });

  var next = projects.slice(0, index).concat(restored, projects.slice(index + 1));
  writeLayout(next);
  return next;
}

function removeQuoteLine(projects, projectId, lineId) {
  if (!lineId) return projects;
  var next = mapProjectsDeep(projects, function (p) {
    if (p.id !== projectId) return p;
    var removed = (p.removedQuoteLineIds || []).slice();
    if (removed.indexOf(lineId) < 0) removed.push(lineId);
    return Object.assign({}, p, { removedQuoteLineIds: removed });
  });
  next = next.map(function (p, index) {
    var enriched = enrichProject(
      Object.assign({}, p, { selected: p.selected, expanded: p.expanded }),
      index
    );
    if (enriched.children && enriched.children.length) {
      enriched.children = enriched.children.map(function (child, childIndex) {
        return enrichProject(
          Object.assign({}, child, { selected: child.selected, expanded: child.expanded }),
          childIndex
        );
      });
    }
    return enriched;
  });
  writeLayout(next);
  return next;
}

function deleteSelected(projects) {
  var next = projects.filter(function (p) {
    return !p.selected;
  });
  writeLayout(next);
  return next;
}

function confirmScheme(projects, projectId) {
  var target = null;
  for (var i = 0; i < (projects || []).length; i += 1) {
    var p = projects[i];
    if (p.id === projectId || p.token === projectId) {
      target = p;
      break;
    }
  }
  if (!target) return null;

  var completedRaw = stripRuntimeFields(
    Object.assign({}, target, {
      status: 'completed',
      statusLabel: '已完成',
      progress: 100,
      updatedAt: new Date().toISOString().slice(0, 10),
      showConfirm: false,
      canEditQuote: false
    })
  );
  completedDisplay.addUserCompletedProject(completedRaw);

  var next = projects
    .filter(function (p) {
      return p.id !== projectId && p.token !== projectId;
    })
    .map(function (p, index) {
      return enrichProject(Object.assign({}, p, { selected: p.selected, expanded: p.expanded }), index);
    });
  writeLayout(next);
  return next;
}

function resetLayout(rawProjects) {
  wx.removeStorageSync(LAYOUT_KEY);
  return buildDisplayProjects(rawProjects);
}

module.exports = {
  buildDisplayProjects: buildDisplayProjects,
  buildCompletedProjects: completedDisplay.buildCompletedProjects,
  filterSchemeProjects: filterSchemeProjects,
  enrichDisplayProject: enrichProject,
  enrichCompletedProject: completedDisplay.enrichCompletedProject,
  findCompletedProject: completedDisplay.findCompletedProject,
  computeSelection: computeSelection,
  toggleSelectAll,
  toggleSelect,
  toggleShellExpand,
  toggleSection,
  mergeSelected,
  deleteSelected,
  removeQuoteLine,
  confirmScheme,
  resetLayout,
  suggestMergedName,
  formatPrice,
  defaultSectionOpen
};
