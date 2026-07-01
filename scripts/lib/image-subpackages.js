/**
 * 五金图分包：主包 ≤2MB，大图拆到 subPackages（各 ≤2MB）
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_MAX_BYTES = 1800000;
const PACK_PREFIX = 'hw-assets';

function listHardwareFiles(srcDir) {
  if (!fs.existsSync(srcDir)) return [];
  return fs
    .readdirSync(srcDir)
    .filter(function (name) {
      return /\.(jpe?g|png|webp)$/i.test(name);
    })
    .map(function (name) {
      const abs = path.join(srcDir, name);
      return { name: name, abs: abs, size: fs.statSync(abs).size };
    })
    .sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
}

function splitIntoBins(files, maxBytes) {
  const bins = [];
  let current = [];
  let currentSize = 0;

  files.forEach(function (file) {
    if (current.length && currentSize + file.size > maxBytes) {
      bins.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(file);
    currentSize += file.size;
  });

  if (current.length) bins.push(current);
  return bins;
}

function ensureEmptyPage(packRoot) {
  const pageDir = path.join(packRoot, 'pages', 'empty');
  fs.mkdirSync(pageDir, { recursive: true });

  const files = {
    'empty.js': 'Page({});\n',
    'empty.wxml': '<view class="empty"></view>\n',
    'empty.wxss': '.empty { display: none; }\n',
    'empty.json': '{ "navigationBarTitleText": "" }\n',
  };

  Object.keys(files).forEach(function (name) {
    const fp = path.join(pageDir, name);
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, files[name], 'utf8');
    }
  });
}

function removeDirContents(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function (name) {
    const fp = path.join(dir, name);
    if (fs.statSync(fp).isDirectory()) {
      fs.rmSync(fp, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fp);
    }
  });
}

/**
 * @returns {{ map: Record<string,string>, packCount: number, totalBytes: number } | null}
 */
function syncHardwareSubPackages(projectRoot, options) {
  const maxBytes = (options && options.maxBytes) || DEFAULT_MAX_BYTES;
  const srcDir = path.join(projectRoot, 'images', 'hardware');
  const files = listHardwareFiles(srcDir);
  if (!files.length) return null;

  const totalBytes = files.reduce(function (sum, f) {
    return sum + f.size;
  }, 0);

  if (totalBytes <= maxBytes) return null;

  const bins = splitIntoBins(files, maxBytes);
  const packagesRoot = path.join(projectRoot, 'miniprogram', 'packages');
  removeDirContents(packagesRoot);

  const map = {};
  bins.forEach(function (bin, index) {
    const packName = PACK_PREFIX + '-' + (index + 1);
    const packRoot = path.join(packagesRoot, packName);
    const destDir = path.join(packRoot, 'images', 'hardware');
    fs.mkdirSync(destDir, { recursive: true });
    ensureEmptyPage(packRoot);

    bin.forEach(function (file) {
      const dest = path.join(destDir, file.name);
      fs.copyFileSync(file.abs, dest);
      const id = file.name.replace(/\.(jpe?g|png|webp)$/i, '');
      map[id] = '/packages/' + packName + '/images/hardware/' + file.name;
    });
  });

  const mainHwDir = path.join(projectRoot, 'miniprogram', 'images', 'hardware');
  removeDirContents(mainHwDir);

  return { map: map, packCount: bins.length, totalBytes: totalBytes };
}

function updateAppJsonSubPackages(projectRoot, packCount) {
  const appPath = path.join(projectRoot, 'miniprogram', 'app.json');
  const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));

  const otherSubs = (app.subPackages || []).filter(function (sub) {
    return !sub.root || sub.root.indexOf('packages/' + PACK_PREFIX) !== 0;
  });

  const hwSubs = [];
  for (let i = 0; i < packCount; i += 1) {
    const packName = PACK_PREFIX + '-' + (i + 1);
    hwSubs.push({
      root: 'packages/' + packName,
      name: packName.replace(/-/g, ''),
      pages: ['pages/empty/empty'],
    });
  }

  app.subPackages = otherSubs.concat(hwSubs);
  fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + '\n', 'utf8');
}

function clearHardwareSubPackages(projectRoot) {
  const packagesRoot = path.join(projectRoot, 'miniprogram', 'packages');
  if (!fs.existsSync(packagesRoot)) return;

  fs.readdirSync(packagesRoot).forEach(function (name) {
    if (name.indexOf(PACK_PREFIX) === 0) {
      fs.rmSync(path.join(packagesRoot, name), { recursive: true, force: true });
    }
  });

  const appPath = path.join(projectRoot, 'miniprogram', 'app.json');
  const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
  app.subPackages = (app.subPackages || []).filter(function (sub) {
    return !sub.root || sub.root.indexOf('packages/' + PACK_PREFIX) !== 0;
  });
  fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + '\n', 'utf8');
}

module.exports = {
  syncHardwareSubPackages,
  updateAppJsonSubPackages,
  clearHardwareSubPackages,
  DEFAULT_MAX_BYTES,
};
