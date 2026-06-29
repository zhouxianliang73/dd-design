/**
 * 本地内容导入后台（仅本机使用，勿暴露到公网）
 *   npm run content:admin
 *   浏览器打开 http://127.0.0.1:3920/content-admin.html
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { importFromExcel } = require('./lib/content-import');

const root = path.join(__dirname, '..');
const port = Number(process.env.CONTENT_ADMIN_PORT || 3920);
const contentDir = path.join(root, 'content');
const imagesDir = path.join(contentDir, 'images');
const excelSavePath = path.join(contentDir, 'dd-content.xlsx');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function ensureDirs() {
  if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
}

function parseMultipart(buffer, boundary) {
  const parts = [];
  const sep = Buffer.from('--' + boundary);
  let start = buffer.indexOf(sep) + sep.length;
  if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;

  while (start < buffer.length) {
    const next = buffer.indexOf(sep, start);
    if (next === -1) break;
    const chunk = buffer.slice(start, next - 2);
    const headerEnd = chunk.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;
    const headerText = chunk.slice(0, headerEnd).toString('utf8');
    const body = chunk.slice(headerEnd + 4);
    const nameMatch = headerText.match(/name="([^"]+)"/);
    const fileMatch = headerText.match(/filename="([^"]*)"/);
    parts.push({
      name: nameMatch ? nameMatch[1] : '',
      filename: fileMatch ? fileMatch[1] : '',
      body: body
    });
    start = next + sep.length;
    if (buffer[start] === 45) break;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
  }
  return parts;
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/content-admin.html';
  const filePath = path.join(root, urlPath.replace(/^\//, '').replace(/\.\./g, ''));
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

ensureDirs();

const server = http.createServer(function (req, res) {
  if (req.method === 'POST' && req.url === '/api/import') {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      sendJson(res, 400, { ok: false, error: '需要 multipart 表单上传' });
      return;
    }

    const chunks = [];
    req.on('data', function (chunk) { chunks.push(chunk); });
    req.on('end', function () {
      try {
        const buffer = Buffer.concat(chunks);
        const parts = parseMultipart(buffer, boundaryMatch[1]);
        const excelPart = parts.find(function (p) { return p.name === 'excel' && p.filename; });
        if (!excelPart || !excelPart.body.length) {
          sendJson(res, 400, { ok: false, error: '请上传 Excel 文件（字段名 excel）' });
          return;
        }

        fs.writeFileSync(excelSavePath, excelPart.body);

        const imageParts = parts.filter(function (p) { return p.name === 'images' && p.filename; });
        imageParts.forEach(function (part) {
          const safeName = part.filename.replace(/[/\\]/g, '_');
          fs.writeFileSync(path.join(imagesDir, safeName), part.body);
        });

        const summary = importFromExcel(excelSavePath, imagesDir, { projectRoot: root });
        sendJson(res, 200, { ok: true, summary: summary });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message || String(err) });
      }
    });
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(port, '127.0.0.1', function () {
  console.log('内容导入后台已启动：http://127.0.0.1:' + port + '/content-admin.html');
  console.log('Excel 默认保存：' + excelSavePath);
  console.log('图片目录：' + imagesDir);
});
