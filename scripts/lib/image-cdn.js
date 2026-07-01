/**
 * 本地 images/ → CDN URL（小程序 uploadFile / downloadFile 合法域名需配置 CDN 主机）
 */
const fs = require('fs');
const path = require('path');

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=320&h=180&fit=crop&auto=format&q=80';

const PLACEHOLDER_CDN_RE = /your-bucket|example\.com|YOUR_/i;

function isRealCdnBase(imageCdnBase) {
  const base = String(imageCdnBase || '').trim();
  if (base.indexOf('https://') !== 0) return false;
  if (PLACEHOLDER_CDN_RE.test(base)) return false;
  return true;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return null;
  }
}

function loadImageCdnConfig(projectRoot) {
  const root = projectRoot || path.join(__dirname, '..', '..');
  const fromFile = readJsonIfExists(path.join(root, 'cdn.config.json'));
  const fromEnv = process.env.IMAGE_CDN_BASE
    ? { imageCdnBase: process.env.IMAGE_CDN_BASE }
    : null;

  let fromMpConfig = null;
  const mpConfigPath = path.join(root, 'miniprogram', 'config', 'config.js');
  if (fs.existsSync(mpConfigPath)) {
    try {
      delete require.cache[require.resolve(mpConfigPath)];
      const cfg = require(mpConfigPath);
      if (cfg && cfg.imageCdnBase) {
        fromMpConfig = { imageCdnBase: cfg.imageCdnBase };
      }
    } catch (err) {
      /* ignore */
    }
  }

  const merged = Object.assign({}, fromFile || {}, fromEnv || {}, fromMpConfig || {});
  const imageCdnBase = String(merged.imageCdnBase || '').trim().replace(/\/$/, '');
  const useCdn = isRealCdnBase(imageCdnBase);
  const copyToMiniprogram =
    merged.copyToMiniprogram != null ? !!merged.copyToMiniprogram : !useCdn;

  if (imageCdnBase && !useCdn) {
    console.warn(
      'imageCdnBase 仍为占位地址，已回退本地模式。请填写真实 CDN 后重新 npm run sync'
    );
  }

  return {
    imageCdnBase: useCdn ? imageCdnBase : '',
    useCdn: useCdn,
    copyToMiniprogram: copyToMiniprogram,
    useImageSubPackages: merged.useImageSubPackages !== false,
    maxSubPackageBytes: merged.maxSubPackageBytes || 1800000,
  };
}

function findLocalAssetRelPath(projectRoot, kind, id, imageLocal) {
  if (!id && !imageLocal) return null;

  if (id) {
    const jpg = path.join(projectRoot, 'images', kind, id + '.jpg');
    const png = path.join(projectRoot, 'images', kind, id + '.png');
    const webp = path.join(projectRoot, 'images', kind, id + '.webp');
    if (fs.existsSync(jpg)) return kind + '/' + id + '.jpg';
    if (fs.existsSync(png)) return kind + '/' + id + '.png';
    if (fs.existsSync(webp)) return kind + '/' + id + '.webp';
  }

  if (imageLocal && String(imageLocal).indexOf('/images/') === 0) {
    const rel = imageLocal.replace(/^\/images\//, '');
    const abs = path.join(projectRoot, 'images', rel.replace(/\//g, path.sep));
    if (fs.existsSync(abs)) return rel.replace(/\\/g, '/');
  }

  return null;
}

function cdnUrlFromRel(cdnBase, relPath) {
  if (!cdnBase || !relPath) return '';
  return cdnBase + '/' + String(relPath).replace(/^\/+/, '');
}

function resolveProductImage(item, projectRoot, kind, cdnConfig) {
  const cfg = cdnConfig || loadImageCdnConfig(projectRoot);
  const rel = findLocalAssetRelPath(
    projectRoot,
    kind,
    item.id || '',
    item.imageLocal || item.image
  );

  if (cfg.useCdn && rel) {
    return cdnUrlFromRel(cfg.imageCdnBase, rel);
  }

  if (rel) {
    return '/images/' + rel;
  }

  if (item.image && String(item.image).indexOf('http') === 0) return item.image;
  if (item.imageFallback && String(item.imageFallback).indexOf('http') === 0) {
    return item.imageFallback;
  }

  return IMAGE_FALLBACK;
}

function resolveDesignerImage(designer, projectRoot, cdnConfig) {
  const cfg = cdnConfig || loadImageCdnConfig(projectRoot);
  const rel = findLocalAssetRelPath(projectRoot, 'designers', designer.id || '', designer.photo);

  if (cfg.useCdn && rel) {
    return cdnUrlFromRel(cfg.imageCdnBase, rel);
  }
  if (rel) return '/images/' + rel;
  if (designer.photo && String(designer.photo).indexOf('http') === 0) return designer.photo;
  if (designer.photoFallback) return designer.photoFallback;
  return IMAGE_FALLBACK;
}

function listLocalAssets(projectRoot) {
  const root = projectRoot || path.join(__dirname, '..', '..');
  const base = path.join(root, 'images');
  const files = [];
  if (!fs.existsSync(base)) return files;

  function walk(dir, prefix) {
    fs.readdirSync(dir).forEach(function (name) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        walk(full, prefix ? prefix + '/' + name : name);
        return;
      }
      if (!/\.(jpe?g|png|webp)$/i.test(name)) return;
      files.push({
        rel: (prefix ? prefix + '/' + name : name).replace(/\\/g, '/'),
        abs: full,
        size: fs.statSync(full).size,
      });
    });
  }

  walk(base, '');
  return files.sort(function (a, b) {
    return a.rel.localeCompare(b.rel);
  });
}

function purgeMiniprogramImages(projectRoot) {
  const mpImages = path.join(projectRoot, 'miniprogram', 'images');
  if (!fs.existsSync(mpImages)) return 0;
  let removed = 0;
  ['designers', 'hardware', 'products'].forEach(function (kind) {
    const dir = path.join(mpImages, kind);
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(function (name) {
      if (!/\.(jpe?g|png|webp)$/i.test(name)) return;
      fs.unlinkSync(path.join(dir, name));
      removed += 1;
    });
  });
  return removed;
}

module.exports = {
  IMAGE_FALLBACK,
  isRealCdnBase,
  loadImageCdnConfig,
  findLocalAssetRelPath,
  cdnUrlFromRel,
  resolveProductImage,
  resolveDesignerImage,
  listLocalAssets,
  purgeMiniprogramImages,
};
