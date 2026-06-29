var catalog = require('./catalog-service');
var channelService = require('./channel-service');

var TOKEN_MAP = {
  户外: ['户外', '阳台', '庭院', '藤编', '遮阳'],
  厨房: ['厨房', '橱柜', '岛台', '台面', '不锈钢'],
  客厅: ['客厅', '沙发', '茶几', '电视柜'],
  卧室: ['卧室', '床', '床头柜'],
  办公: ['办公', '书桌', '椅子'],
  法式: ['法式', '雕花', '复古'],
  现代: ['现代', '极简', '简约'],
  中古: ['中古', '复古'],
  美式: ['美式', '胡桃木']
};

function extractTokens(text, channelId) {
  var tokens = [];
  var raw = (text || '').toLowerCase();

  Object.keys(TOKEN_MAP).forEach(function (key) {
    if (raw.indexOf(key) >= 0) {
      TOKEN_MAP[key].forEach(function (t) {
        tokens.push(t);
      });
    }
  });

  raw.split(/[\s,，。；;、]+/).forEach(function (part) {
    if (part && part.length >= 2) tokens.push(part);
  });

  if (!tokens.length) {
    var channel = channelService.getChannel(channelId);
    if (channel && channel.catalogSpaces && channel.catalogSpaces.length) {
      channel.catalogSpaces.forEach(function (space) {
        tokens.push(space);
      });
    } else {
      tokens.push('家具', '现代');
    }
  }

  return tokens;
}

function callCloudAnalyze(filePath, userNote, channelId) {
  return new Promise(function (resolve, reject) {
    if (!wx.cloud) {
      reject(new Error('cloud_unavailable'));
      return;
    }

    var cloudPath = 'ai-refs/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + '.jpg';

    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: function (uploadRes) {
        wx.cloud.callFunction({
          name: 'analyzeReference',
          data: {
            fileID: uploadRes.fileID,
            userNote: userNote || '',
            channelId: channelId || 'custom'
          },
          success: function (res) {
            resolve(res.result || {});
          },
          fail: reject
        });
      },
      fail: reject
    });
  });
}

function analyzeLocal(userNote, channelId) {
  var keywords = extractTokens(userNote, channelId);
  var products = catalog.recommendProducts(channelId, keywords, 6).map(function (item) {
    return Object.assign({}, item, {
      priceText: catalog.formatPrice(item.price)
    });
  });

  return {
    mode: 'local',
    summary:
      '已根据您的文字描述与当前渠道，从目录中匹配推荐产品。开通云开发并配置视觉 AI 后，可直接识别参考图内容。',
    keywords: keywords,
    products: products
  };
}

function analyzeReferenceImage(filePath, userNote, channelId) {
  return callCloudAnalyze(filePath, userNote, channelId)
    .then(function (result) {
      var keywords = result.keywords || extractTokens(userNote, channelId);
      var products;

      if (result.productIds && result.productIds.length) {
        products = result.productIds
          .map(function (id) {
            var p = catalog.getProduct(id);
            if (!p) return null;
            return Object.assign({}, p, { priceText: catalog.formatPrice(p.price) });
          })
          .filter(Boolean);
      } else {
        products = catalog.recommendProducts(channelId, keywords, 6).map(function (item) {
          return Object.assign({}, item, { priceText: catalog.formatPrice(item.price) });
        });
      }

      return {
        mode: result.mode || 'cloud',
        summary: result.summary || '已为您生成选品建议。',
        keywords: keywords,
        products: products
      };
    })
    .catch(function () {
      return analyzeLocal(userNote, channelId);
    });
}

function chooseReferenceImages(sourceType, existingCount) {
  var remain = 9 - (existingCount || 0);
  if (remain <= 0) {
    return Promise.reject(new Error('max_images'));
  }

  return new Promise(function (resolve, reject) {
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: sourceType || ['album', 'camera'],
      sizeType: ['compressed'],
      success: function (res) {
        var paths = (res.tempFiles || [])
          .map(function (f) {
            return f.tempFilePath;
          })
          .filter(Boolean);
        if (!paths.length) {
          reject(new Error('no_image'));
          return;
        }
        resolve(paths);
      },
      fail: reject
    });
  });
}

function chooseReferenceImage(sourceType) {
  return chooseReferenceImages(sourceType, 0).then(function (paths) {
    return paths[0];
  });
}

function buildClientBrief(fields) {
  var parts = [];
  if (fields.userNote) parts.push(fields.userNote.trim());
  if (fields.projectAddress) parts.push('项目地址：' + fields.projectAddress.trim());
  if (fields.expectDate) parts.push('期望时间：' + fields.expectDate);
  if (fields.imageCount) parts.push('参考图数量：' + fields.imageCount + ' 张');
  return parts.join('\n');
}

module.exports = {
  chooseReferenceImage,
  chooseReferenceImages,
  analyzeReferenceImage,
  analyzeLocal,
  extractTokens,
  buildClientBrief
};
