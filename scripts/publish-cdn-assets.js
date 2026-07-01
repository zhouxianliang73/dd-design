/**
 * 生成本地 images/ → CDN 上传清单（配合 cdn.config.json）
 *   npm run cdn:manifest
 *   node scripts/publish-cdn-assets.js
 */
const fs = require('fs');
const path = require('path');
const {
  loadImageCdnConfig,
  listLocalAssets,
  cdnUrlFromRel,
} = require('./lib/image-cdn');

const root = path.join(__dirname, '..');
const cfg = loadImageCdnConfig(root);
const assets = listLocalAssets(root);
const outPath = path.join(root, 'content', 'cdn-upload-manifest.json');

if (!cfg.useCdn) {
  console.error('请配置 CDN：复制 cdn.config.example.json → cdn.config.json 并填写 imageCdnBase');
  console.error('或设置环境变量 IMAGE_CDN_BASE');
  process.exit(1);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  imageCdnBase: cfg.imageCdnBase,
  totalFiles: assets.length,
  totalBytes: assets.reduce(function (sum, item) {
    return sum + item.size;
  }, 0),
  files: assets.map(function (item) {
    return {
      local: path.join('images', item.rel).replace(/\\/g, '/'),
      cdnUrl: cdnUrlFromRel(cfg.imageCdnBase, item.rel),
      bytes: item.size,
    };
  }),
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

const mb = (manifest.totalBytes / 1024 / 1024).toFixed(2);
console.log('CDN 基址', cfg.imageCdnBase);
console.log('待上传', manifest.totalFiles, '个文件 ·', mb, 'MB');
console.log('清单 →', outPath);
console.log('\n上传步骤（腾讯云 COS 示例）：');
console.log('  1. 控制台创建存储桶，开启公有读（或 CDN 回源）');
console.log('  2. 将 images/ 下文件按相同目录上传到桶内 dd-miniprogram/ 前缀');
console.log('  3. 微信公众平台 → 开发管理 → 服务器域名 → downloadFile 合法域名 添加 CDN 主机');
console.log('  4. npm run sync  重新生成 catalog-lite.js（图片 URL 指向 CDN）');
