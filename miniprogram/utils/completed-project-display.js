var USER_COMPLETED_KEY = 'dd_user_completed_projects';

var DESIGNERS = ['张俊', '顾欣', '盛菲', '周楚轩', '周宏'];
var COVER_EMOJIS = ['🗄️', '🛋️', '🛏️', '🍽️', '📚', '🏡'];

var KITCHEN_IMAGES = [
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=96&h=96&fit=crop&auto=format&q=80'
];

var SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=96&h=96&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=96&h=96&fit=crop&auto=format&q=80'
];

var COMPLETED_DEMO_RAW = [
  {
    token: 'demo-completed-001',
    clientName: 'Lisa · 主卧',
    projectNo: 'DD-DEMO-020',
    status: 'completed',
    statusLabel: '已完成',
    updatedAt: '2026-06-28',
    designer: '顾欣',
    projectType: '卧室改造',
    address: '北京朝阳区 xxx 街 88 号',
    price: 45000,
    progress: 100,
    coverEmoji: '🛏️'
  },
  {
    token: 'demo-completed-002',
    clientName: '王先生 · 书房',
    projectNo: 'DD-DEMO-021',
    status: 'completed',
    statusLabel: '已完成',
    updatedAt: '2026-06-25',
    designer: '盛菲',
    projectType: '书房定制',
    address: '深圳南山区 xxx 大道 66 号',
    price: 22500,
    progress: 100,
    coverEmoji: '📚'
  },
  {
    token: 'demo-completed-003',
    clientName: '张先生 · 全屋设计',
    projectNo: 'DD-DEMO-022',
    status: 'completed',
    statusLabel: '已完成',
    updatedAt: '2026-06-20',
    designer: '张俊',
    projectType: '全屋全案',
    address: '上海浦东新区 xxx 路 123 号',
    price: 128000,
    progress: 100,
    coverEmoji: '🏡'
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

function formatPrice(value) {
  return '¥' + Number(value || 0).toLocaleString('zh-CN');
}

function decorateProductLine(line) {
  var unitPrice = line.unitPrice || 0;
  var qty = line.qty || 1;
  var coef = line.coef || 1;
  return Object.assign({}, line, {
    unitPriceText: formatPrice(unitPrice),
    lineTotalText: formatPrice(unitPrice * qty * coef)
  });
}

function defaultSectionOpen() {
  return {
    products: false,
    commImages: false,
    commContent: false,
    schemeVersions: false
  };
}

function demoMediaNote(prefix, idx) {
  return { url: KITCHEN_IMAGES[idx % KITCHEN_IMAGES.length], note: prefix + (idx + 1) };
}

var COMPLETED_DELIVERY_DEMOS = [
  {
    payment: {
      statusLabel: '已付清',
      totalText: '¥45,000',
      paidText: '¥45,000',
      dueText: '¥0',
      hint: '款项已结清，可查看发货与安装记录'
    },
    production: {
      summary: '主卧定制已生产安装完成',
      steps: [
        { label: '下单组料', done: true, date: '2026-06-25' },
        { label: '拆板', done: true, date: '2026-07-02' },
        { label: '生产', done: true, date: '2026-07-08' },
        { label: '安装', done: true, date: '2026-07-12' }
      ],
      images: [demoMediaNote('组料', 0), demoMediaNote('生产', 2)]
    },
    shipping: {
      summary: '顺丰已签收',
      trackingNo: 'SF1324567890123',
      carrier: '顺丰速运',
      documents: [
        { name: '发货单 DD-SH-20260625-018', note: '主卧批次', image: KITCHEN_IMAGES[0] },
        { name: '装箱清单', note: '件数 12 · 方数 3.2', image: KITCHEN_IMAGES[1] }
      ],
      photoGroups: [
        {
          title: '发货前照片',
          images: [demoMediaNote('发货前', 0), demoMediaNote('质检', 2)]
        },
        {
          title: '装车 / 上集装箱',
          images: [demoMediaNote('装车', 1), demoMediaNote('集装箱', 3)]
        }
      ]
    },
    tracking: [
      { date: '2026-06-28 14:20', text: '已签收 · 客户确认收货' },
      { date: '2026-06-27 09:10', text: '运输中 · 深圳 → 北京' },
      { date: '2026-06-25 16:00', text: '已发货 · 工厂出库' }
    ]
  },
  {
    payment: {
      statusLabel: '待付尾款',
      totalText: '¥22,500',
      paidText: '¥18,000',
      dueText: '¥4,500',
      hint: '尾款到账后安排余货发货'
    },
    production: {
      summary: '书房柜体生产完成，质检包装中',
      steps: [
        { label: '下单组料', done: true, date: '2026-06-18' },
        { label: '拆板', done: true, date: '2026-06-22' },
        { label: '生产', done: true, date: '2026-06-28' },
        { label: '安装', done: false, date: '待安排' }
      ],
      images: [demoMediaNote('拆板', 2), demoMediaNote('质检', 3)]
    },
    shipping: {
      summary: '主件已发运，余货待尾款',
      trackingNo: 'SF9988776655443',
      carrier: '顺丰速运',
      documents: [
        { name: '发货单 DD-SH-20260624-012', note: '书房主柜', image: KITCHEN_IMAGES[2] }
      ],
      photoGroups: [
        {
          title: '发货前照片',
          images: [demoMediaNote('包装', 2), demoMediaNote('货单核对', 3)]
        },
        {
          title: '装车 / 上集装箱',
          images: [demoMediaNote('货单', 0)]
        }
      ]
    },
    tracking: [
      { date: '2026-06-25 11:30', text: '运输中 · 主件在途' },
      { date: '2026-06-24 08:00', text: '已发货 · 书房主柜' }
    ]
  },
  {
    payment: {
      statusLabel: '已付清',
      totalText: '¥128,000',
      paidText: '¥128,000',
      dueText: '¥0',
      hint: '全屋项目款项已结清'
    },
    production: {
      summary: '全屋定制已验收',
      steps: [
        { label: '下单组料', done: true, date: '2026-05-20' },
        { label: '拆板', done: true, date: '2026-05-28' },
        { label: '生产', done: true, date: '2026-06-10' },
        { label: '安装', done: true, date: '2026-06-18' }
      ],
      images: [demoMediaNote('安装', 1), demoMediaNote('验收', 4)]
    },
    shipping: {
      summary: '分批到货，全部签收',
      trackingNo: 'SF5566778899001',
      carrier: '德邦物流',
      documents: [
        { name: '发货单 批次一', note: '客厅 + 餐厅', image: KITCHEN_IMAGES[1] },
        { name: '发货单 批次二', note: '卧室 + 书房', image: KITCHEN_IMAGES[2] }
      ],
      photoGroups: [
        {
          title: '发货前照片',
          images: [demoMediaNote('装车前', 1), demoMediaNote('木架加固', 4)]
        },
        {
          title: '装车 / 上集装箱',
          images: [demoMediaNote('集装箱', 2), demoMediaNote('封柜', 3)]
        }
      ]
    },
    tracking: [
      { date: '2026-06-20 18:00', text: '全部批次签收完成' },
      { date: '2026-06-15 10:20', text: '第二批到货' },
      { date: '2026-06-08 09:00', text: '第一批到货' }
    ]
  }
];

function isCompletedProject(project) {
  if (!project) return false;
  var token = String(project.token || project.id || '');
  if (token.indexOf('demo-completed') === 0) return true;
  if (project.status === 'completed') return true;
  if (project.statusLabel === '已完成') return true;
  return false;
}

function attachCompletedContent(project, index) {
  var products = (DEMO_PRODUCTS[index % DEMO_PRODUCTS.length] || DEMO_PRODUCTS[0]).map(function (line, idx) {
    return decorateProductLine(Object.assign({ lineId: 'cp-' + index + '-' + idx }, line));
  });
  var delivery = COMPLETED_DELIVERY_DEMOS[index % COMPLETED_DELIVERY_DEMOS.length];
  var sectionOpen = Object.assign({}, defaultSectionOpen(), project.sectionOpen || {}, {
    payment: false,
    production: false,
    shipping: false,
    tracking: false,
    products: false
  });
  return Object.assign({}, project, {
    products: products,
    comm: null,
    quoteCategories: null,
    showConfirm: false,
    showDelivery: true,
    phase: 'delivery',
    expanded: false,
    sectionOpen: sectionOpen,
    payment: delivery.payment,
    production: delivery.production,
    shipping: delivery.shipping,
    tracking: delivery.tracking,
    price:
      project.price != null
        ? project.price
        : products.reduce(function (s, line) {
            return s + (line.unitPrice || 0) * (line.qty || 1);
          }, 0)
  });
}

function enrichCompletedProject(project, index) {
  var base = Object.assign({}, project, {
    id: project.id || project.token,
    designer: project.designer || DESIGNERS[index % DESIGNERS.length],
    priceText: formatPrice(project.price || 0),
    coverEmoji: project.coverEmoji || COVER_EMOJIS[index % COVER_EMOJIS.length]
  });
  var enriched = attachCompletedContent(base, index);
  enriched.priceText = formatPrice(enriched.price);
  return enriched;
}

function findProjectById(projects, id) {
  for (var i = 0; i < (projects || []).length; i += 1) {
    var p = projects[i];
    if (p.id === id || p.token === id) return p;
    if (p.children && p.children.length) {
      var child = findProjectById(p.children, id);
      if (child) return child;
    }
  }
  return null;
}

function readUserCompletedRaw() {
  try {
    var list = wx.getStorageSync(USER_COMPLETED_KEY);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function writeUserCompletedRaw(list) {
  wx.setStorageSync(USER_COMPLETED_KEY, list || []);
}

function stripCompletedForStorage(project) {
  var copy = Object.assign({}, project, { selected: false, expanded: false });
  delete copy.products;
  delete copy.quoteCategories;
  delete copy.comm;
  delete copy.payment;
  delete copy.production;
  delete copy.shipping;
  delete copy.tracking;
  delete copy.sectionOpen;
  delete copy.priceText;
  if (copy.children && copy.children.length) {
    copy.children = copy.children.map(stripCompletedForStorage);
  }
  return copy;
}

function addUserCompletedProject(project) {
  if (!project) return;
  var raw = stripCompletedForStorage(project);
  var id = raw.id || raw.token;
  var list = readUserCompletedRaw().filter(function (p) {
    return (p.id || p.token) !== id;
  });
  list.unshift(raw);
  writeUserCompletedRaw(list);
}

function buildCompletedProjects(rawProjects) {
  var userList = readUserCompletedRaw().map(function (item, index) {
    return enrichCompletedProject(item, index);
  });
  var fromApi = (rawProjects || []).filter(isCompletedProject).map(function (item, index) {
    return enrichCompletedProject(item, userList.length + index);
  });
  var merged = userList.concat(fromApi);
  if (merged.length) return merged;
  return COMPLETED_DEMO_RAW.map(function (item, index) {
    return enrichCompletedProject(Object.assign({}, item), index);
  });
}

function findCompletedProject(id, rawProjects) {
  var list = buildCompletedProjects(rawProjects);
  return findProjectById(list, id);
}

module.exports = {
  isCompletedProject: isCompletedProject,
  buildCompletedProjects: buildCompletedProjects,
  enrichCompletedProject: enrichCompletedProject,
  findCompletedProject: findCompletedProject,
  addUserCompletedProject: addUserCompletedProject
};
