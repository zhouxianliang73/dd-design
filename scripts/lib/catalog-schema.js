/**
 * 商品清单标准列 · 外网文件接入 catalog.json 的唯一格式
 * 生成模板与导入清洗共用此定义
 */
const PRODUCT_COLUMNS = [
  { key: 'id', header: 'ID', required: true, hint: '必填，如 f-001、k-cab-001' },
  { key: 'name', header: '名称', required: true, hint: '产品名称' },
  { key: 'space', header: '空间', required: true, hint: '民用家具 / 户外家具 / 不锈钢橱柜 …' },
  { key: 'sub', header: '子类', hint: '餐桌 / 柜体 / 台面 …' },
  { key: 'style', header: '风格', hint: '现代 / 法式 / 中古 …' },
  { key: 'color', header: '颜色', hint: '深色 / 浅色 / 灰色 …' },
  { key: 'spec', header: '规格', hint: '展示用规格文案' },
  { key: 'material', header: '材质', hint: '通用材质；橱柜柜体可填 materialBody' },
  { key: 'materialDoor', header: '材质(门板)', hint: '不锈钢橱柜可选' },
  { key: 'price', header: '单价', hint: '数字，可带 ¥ 与千分位' },
  { key: 'unit', header: '单位', hint: '个 / 米 / 件，默认「个」' },
  { key: 'qty', header: '数量', hint: '清单默认数量，默认 1' },
  { key: 'w', header: '宽mm', hint: '毫米，整数' },
  { key: 'h', header: '高mm', hint: '毫米，整数' },
  { key: 'd', header: '深mm', hint: '毫米，整数' },
  { key: 'coef', header: '系数', hint: '清单系数，默认 1' },
  { key: 'emoji', header: '图标', hint: '选品卡片 emoji，可空' },
  { key: 'featured', header: '爆款', hint: '是 / 否' },
  { key: 'channels', header: '渠道', hint: '逗号分隔：outdoor-living,custom' },
  { key: 'quoteSections', header: '清单分组', hint: 'products / cabinet / countertop …' },
  { key: 'image', header: '图片', hint: 'https://… 或本地文件名' },
  { key: 'sourceRef', header: '外网来源', hint: '供应商 SKU 或来源链接，仅归档' },
];

/** 外网常见列名 → 标准 key */
const COLUMN_ALIASES = {
  id: ['ID', 'id', '编号', 'SKU', 'sku', '产品编号', '货号'],
  name: ['名称', 'name', '品名', '产品名称', '商品名称'],
  space: ['空间', 'space', '品类', '大类', '分类'],
  sub: ['子类', 'sub', '小类', '二级分类'],
  style: ['风格', 'style'],
  color: ['颜色', 'color', '色系'],
  spec: ['规格', 'spec', '尺寸说明', '规格说明', '规格尺寸'],
  material: ['材质', 'material', '材料', '柜体材质', 'materialBody'],
  materialDoor: ['材质(门板)', 'materialDoor', '门板材质', '门片材质'],
  price: ['单价', 'price', '价格', '售价', 'unitPrice', '报价', '零售价'],
  unit: ['单位', 'unit', '计量单位'],
  qty: ['数量', 'qty', '默认数量'],
  w: ['宽mm', 'w', '宽', '宽度', '宽度mm'],
  h: ['高mm', 'h', '高', '高度', '高度mm'],
  d: ['深mm', 'd', '深', '深度', '深度mm'],
  coef: ['系数', 'coef'],
  emoji: ['图标', 'emoji'],
  featured: ['爆款', 'featured', '精选', '主推'],
  channels: ['渠道', 'channels', '销售渠道'],
  quoteSections: ['清单分组', 'quoteSections', '报价分组', '清单板块'],
  image: ['图片', 'image', '主图', '封面', '图片URL', '图片地址'],
  sourceRef: ['外网来源', 'sourceRef', '来源', '供应商编号', '外部ID', '物料编码'],
};

const VALID_CHANNELS = [
  'custom', 'outdoor-living', 'outdoor-kitchen', 'french-ru', 'event-ru',
];

const QUOTE_SECTION_DEFAULTS = {
  '不锈钢橱柜': 'cabinet',
  '不锈钢家具': 'products',
};

module.exports = {
  PRODUCT_COLUMNS,
  COLUMN_ALIASES,
  VALID_CHANNELS,
  QUOTE_SECTION_DEFAULTS,
  productHeaders: function () {
    return PRODUCT_COLUMNS.map(function (c) { return c.header; });
  },
};
