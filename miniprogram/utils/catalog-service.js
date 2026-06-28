const channelService = require('./channel-service');

let catalogLiteCache = null;

/** 首页爆款默认 ID，同步目录后仍优先展示 */
const HOT_PRODUCT_IDS = ['f-013', 'f-004', 'f-001', 'f-014', 'f-003', 'f-012'];

function loadCatalogLite() {
  if (!catalogLiteCache) {
    catalogLiteCache = require('../data/catalog-lite.js');
  }
  return catalogLiteCache;
}

function getAllProducts() {
  const data = loadCatalogLite();
  return data.products || [];
}

function getProduct(id) {
  const products = getAllProducts();
  for (let i = 0; i < products.length; i += 1) {
    if (products[i].id === id) return products[i];
  }
  return null;
}

function uniqueSorted(values) {
  const set = new Set();
  values.forEach(function (v) {
    if (v) set.add(v);
  });
  return Array.from(set).sort();
}

function filterProducts(channelId, keyword, filters) {
  const channel = channelService.getChannel(channelId);
  let list = getAllProducts();

  if (channel && Array.isArray(channel.catalogSpaces) && channel.catalogSpaces.length) {
    list = list.filter(function (item) {
      return channel.catalogSpaces.indexOf(item.space) >= 0;
    });
  }

  if (channel && channel.includeFrenchStyle) {
    list = list.filter(function (item) {
      return item.style === '法式' || (item.channels || []).indexOf(channelId) >= 0;
    });
  }

  if (channelId) {
    list = list.filter(function (item) {
      if (!item.channels || !item.channels.length) return true;
      return item.channels.indexOf(channelId) >= 0;
    });
  }

  if (filters) {
    if (filters.space) {
      list = list.filter(function (item) {
        return item.space === filters.space;
      });
    }
    if (filters.sub) {
      list = list.filter(function (item) {
        return item.sub === filters.sub;
      });
    }
    if (filters.style) {
      list = list.filter(function (item) {
        return item.style === filters.style;
      });
    }
    if (filters.color) {
      list = list.filter(function (item) {
        return item.color === filters.color;
      });
    }
  }

  if (keyword) {
    const q = keyword.trim().toLowerCase();
    list = list.filter(function (item) {
      const hay = [item.name, item.space, item.sub, item.style, item.material].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  return list;
}

function getFilterOptions(channelId, selectedSpace) {
  const list = filterProducts(channelId, '');
  const spaces = uniqueSorted(list.map(function (item) {
    return item.space;
  }));
  const styles = uniqueSorted(list.map(function (item) {
    return item.style;
  }));
  const colors = uniqueSorted(list.map(function (item) {
    return item.color;
  }));

  let subSource = list;
  if (selectedSpace) {
    subSource = list.filter(function (item) {
      return item.space === selectedSpace;
    });
  }
  const subs = uniqueSorted(subSource.map(function (item) {
    return item.sub;
  }));

  return { spaces, styles, colors, subs };
}

function scoreProduct(item, tokens) {
  let score = 0;
  const hay = [item.name, item.space, item.sub, item.style, item.material, item.color, item.spec]
    .join(' ')
    .toLowerCase();

  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (!t) continue;
    if (hay.indexOf(t) >= 0) score += 3;
    if (item.space && item.space.indexOf(t) >= 0) score += 4;
    if (item.style && item.style.indexOf(t) >= 0) score += 2;
  }
  if (item.featured) score += 1;
  return score;
}

function recommendProducts(channelId, keywords, limit) {
  const max = limit || 6;
  const tokens = (keywords || []).map(function (k) {
    return String(k).trim().toLowerCase();
  }).filter(Boolean);

  let list = filterProducts(channelId, '');
  if (!tokens.length) {
    return list.slice(0, max).map(function (item) {
      return Object.assign({}, item, { matchScore: 0 });
    });
  }

  const scored = list
    .map(function (item) {
      return Object.assign({}, item, { matchScore: scoreProduct(item, tokens) });
    })
    .filter(function (item) {
      return item.matchScore > 0;
    })
    .sort(function (a, b) {
      return b.matchScore - a.matchScore;
    });

  if (!scored.length) {
    return list.slice(0, max).map(function (item) {
      return Object.assign({}, item, { matchScore: 0 });
    });
  }

  return scored.slice(0, max);
}

function formatPrice(value) {
  if (value == null || value === '') return '询价';
  return '¥' + Number(value).toLocaleString('zh-CN');
}

function decorateProduct(item) {
  return Object.assign({}, item, { priceText: formatPrice(item.price) });
}

function getHotProducts(channelId, limit, excludeIds) {
  const max = limit || 4;
  const exclude = new Set(excludeIds || []);
  const filtered = filterProducts(channelId, '');
  const hotSet = new Set(HOT_PRODUCT_IDS);

  let hot = filtered.filter(function (item) {
    return hotSet.has(item.id) && !exclude.has(item.id);
  });

  if (hot.length < max) {
    filtered.forEach(function (item) {
      if (!hotSet.has(item.id) && !exclude.has(item.id)) {
        hot.push(item);
      }
    });
  }

  return hot.slice(0, max).map(decorateProduct);
}

function getFavoriteProducts(channelId, favoriteIds) {
  const ids = favoriteIds || [];
  const filtered = filterProducts(channelId, '');
  const idSet = new Set(filtered.map(function (item) {
    return item.id;
  }));

  const products = [];
  ids.forEach(function (id) {
    if (!idSet.has(id)) return;
    const item = getProduct(id);
    if (item) products.push(decorateProduct(item));
  });
  return products;
}

function getHomeRecommendProducts(channelId, favoriteIds, limit) {
  const max = limit || 6;
  const favorites = getFavoriteProducts(channelId, favoriteIds).map(function (item) {
    return Object.assign({}, item, { isFavorite: true });
  });
  const excludeIds = favorites.map(function (item) {
    return item.id;
  });
  const hotCount = Math.max(0, max - favorites.length);
  const hot = getHotProducts(channelId, hotCount, excludeIds).map(function (item) {
    return Object.assign({}, item, { isFavorite: false });
  });
  return favorites.concat(hot);
}

module.exports = {
  getAllProducts,
  getProduct,
  filterProducts,
  getFilterOptions,
  recommendProducts,
  getHotProducts,
  getFavoriteProducts,
  getHomeRecommendProducts,
  decorateProduct,
  formatPrice
};
