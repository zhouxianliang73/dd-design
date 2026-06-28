var STORAGE_KEY = 'dd_favorite_products';

function getIds() {
  try {
    var ids = wx.getStorageSync(STORAGE_KEY);
    return Array.isArray(ids) ? ids : [];
  } catch (e) {
    return [];
  }
}

function saveIds(ids) {
  wx.setStorageSync(STORAGE_KEY, ids);
}

function isFavorite(productId) {
  return getIds().indexOf(productId) >= 0;
}

function toggle(productId) {
  var ids = getIds();
  var index = ids.indexOf(productId);
  if (index >= 0) {
    ids.splice(index, 1);
    saveIds(ids);
    return false;
  }
  ids.unshift(productId);
  saveIds(ids);
  return true;
}

module.exports = {
  getIds,
  isFavorite,
  toggle
};
