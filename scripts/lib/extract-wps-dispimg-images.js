/**
 * 从 WPS/Excel 五金价目表（DISPIMG 嵌入图）批量导出图片
 * xlsx 内 xl/cellimages.xml + xl/media/ + xl/_rels/cellimages.xml.rels
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const XLSX = require('xlsx');
const { convertHardwareRows } = require('./convert-hardware-xlsx');

function parseDispimgId(value) {
  const raw = String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
  const m = /=DISPIMG\s*\(\s*"([^"]+)"/i.exec(raw);
  return m ? m[1] : '';
}

function unzipXlsx(xlsxPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const zipCopy = path.join(destDir, 'book.zip');
  fs.copyFileSync(xlsxPath, zipCopy);
  if (process.platform === 'win32') {
    execSync(
      'powershell -NoProfile -Command "Expand-Archive -LiteralPath \'' +
        zipCopy.replace(/'/g, "''") +
        "' -DestinationPath '" +
        destDir.replace(/'/g, "''") +
        "' -Force\"",
      { stdio: 'pipe' }
    );
  } else {
    execSync('unzip -o -q "' + zipCopy + '" -d "' + destDir + '"', { stdio: 'pipe' });
  }
}

function parseCellImageMap(extractDir) {
  const xmlPath = path.join(extractDir, 'xl', 'cellimages.xml');
  const relsPath = path.join(extractDir, 'xl', '_rels', 'cellimages.xml.rels');
  if (!fs.existsSync(xmlPath) || !fs.existsSync(relsPath)) {
    return { guidToMedia: {}, hasCellImages: false };
  }

  const xml = fs.readFileSync(xmlPath, 'utf8');
  const relsXml = fs.readFileSync(relsPath, 'utf8');
  const relMap = {};
  const relRe = /Id="(rId\d+)"[^>]*Target="([^"]+)"/g;
  let relMatch;
  while ((relMatch = relRe.exec(relsXml))) {
    relMap[relMatch[1]] = relMatch[2].replace(/^\/?/, '');
  }

  const guidToMedia = {};
  const blocks = xml.split('<etc:cellImage>');
  blocks.slice(1).forEach(function (block) {
    const nameMatch = /name="(ID_[^"]+)"/.exec(block);
    const embedMatch = /r:embed="(rId\d+)"/.exec(block);
    if (!nameMatch || !embedMatch) return;
    const media = relMap[embedMatch[1]];
    if (media) guidToMedia[nameMatch[1]] = media;
  });

  return { guidToMedia: guidToMedia, hasCellImages: true };
}

function mediaExt(mediaPath) {
  const ext = path.extname(mediaPath).toLowerCase();
  if (ext === '.jpeg' || ext === '.jpg') return '.jpg';
  if (ext === '.png') return '.png';
  if (ext === '.webp') return '.webp';
  return ext || '.jpg';
}

/**
 * @param {string} xlsxPath
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {object[]} [options.products] - catalog.products，用于匹配 SKU id
 * @param {string} [options.outDir] - 默认 images/hardware
 * @param {boolean} [options.updateCatalog] - 写回 image / imageLocal
 * @returns {{ exported: number, skipped: number, missing: number, log: object[], warnings: string[] }}
 */
function exportHardwareImagesFromXlsx(xlsxPath, options) {
  const projectRoot = options.projectRoot || path.join(__dirname, '..', '..');
  const outDir = options.outDir || path.join(projectRoot, 'images', 'hardware');
  const products = options.products || [];
  const updateCatalog = options.updateCatalog !== false;

  fs.mkdirSync(outDir, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hw-xlsx-'));
  const warnings = [];
  const log = [];
  let exported = 0;
  let skipped = 0;
  let missing = 0;

  try {
    unzipXlsx(xlsxPath, tmpDir);
    const { guidToMedia, hasCellImages } = parseCellImageMap(tmpDir);
    if (!hasCellImages) {
      warnings.push('未找到 WPS cellimages.xml，无法自动导出嵌入图');
      return { exported, skipped, missing, log, warnings };
    }

    const wb = XLSX.readFile(xlsxPath);
    const sheetName = wb.SheetNames.find(function (n) {
      return XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' }).length > 0;
    });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    const converted = convertHardwareRows(rows, products);

    converted.items.forEach(function (item, index) {
      const row = rows[index];
      const imageRaw = row['图例'] || row['图片'] || '';
      const guid = parseDispimgId(imageRaw);
      if (!guid) {
        skipped += 1;
        return;
      }

      const mediaRel = guidToMedia[guid];
      if (!mediaRel) {
        missing += 1;
        warnings.push('第 ' + (index + 2) + ' 行「' + item.product.name + '」：找不到嵌入图 ' + guid);
        return;
      }

      const srcPath = path.join(tmpDir, 'xl', mediaRel.replace(/\//g, path.sep));
      if (!fs.existsSync(srcPath)) {
        missing += 1;
        warnings.push('第 ' + (index + 2) + ' 行「' + item.product.name + '」：媒体文件缺失 ' + mediaRel);
        return;
      }

      const ext = mediaExt(mediaRel);
      const fileName = item.product.id + ext;
      const destPath = path.join(outDir, fileName);
      fs.copyFileSync(srcPath, destPath);
      exported += 1;

      const imageUrl = '/images/hardware/' + fileName;
      log.push({ id: item.product.id, name: item.product.name, file: fileName, guid: guid });

      if (updateCatalog) {
        const catalogProduct = products.find(function (p) {
          return p.id === item.product.id;
        });
        if (catalogProduct) {
          catalogProduct.image = imageUrl;
          catalogProduct.imageLocal = imageUrl;
        }
      }
    });
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      /* ignore cleanup errors */
    }
  }

  return { exported, skipped, missing, log, warnings };
}

module.exports = {
  parseDispimgId,
  parseCellImageMap,
  exportHardwareImagesFromXlsx,
};
