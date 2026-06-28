const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const TOKEN_MAP = {
  户外: ['户外', '阳台', '庭院'],
  厨房: ['厨房', '橱柜', '岛台', '不锈钢'],
  客厅: ['客厅', '沙发', '茶几'],
  卧室: ['卧室', '床'],
  办公: ['办公', '书桌'],
  法式: ['法式'],
  现代: ['现代', '极简'],
  中古: ['中古'],
  美式: ['美式']
};

function extractTokens(text) {
  const tokens = [];
  const raw = (text || '').toLowerCase();
  Object.keys(TOKEN_MAP).forEach((key) => {
    if (raw.indexOf(key) >= 0) TOKEN_MAP[key].forEach((t) => tokens.push(t));
  });
  raw.split(/[\s,，。；;、]+/).forEach((part) => {
    if (part && part.length >= 2) tokens.push(part);
  });
  return tokens;
}

function downloadFileBuffer(fileID) {
  return cloud.downloadFile({ fileID }).then(function (res) {
    return res.fileContent;
  });
}

function callOpenAIVision(base64, userNote) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Promise.reject(new Error('no_openai_key'));

  const body = JSON.stringify({
    model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              '你是室内设计选品顾问。分析这张参考图，用中文简短说明空间类型、风格、材质与配色，并给出5个可用于检索产品的关键词（空格分隔）。格式：第一句总结；第二行以 Keywords: 开头列出关键词。' +
              (userNote ? '\n客户补充：' + userNote : '')
          },
          {
            type: 'image_url',
            image_url: { url: 'data:image/jpeg;base64,' + base64 }
          }
        ]
      }
    ],
    max_tokens: 300
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) reject(new Error(json.error.message || 'openai_error'));
            else resolve(json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseVisionText(text) {
  const lines = String(text || '').split('\n');
  let summary = lines[0] || '已分析参考图。';
  let keywords = [];

  lines.forEach((line) => {
    if (/keywords?\s*[:：]/i.test(line)) {
      const part = line.split(/[:：]/)[1] || '';
      keywords = part.split(/[\s,，、]+/).filter(Boolean);
    }
  });

  if (!keywords.length) {
    keywords = extractTokens(summary);
  }

  return { summary, keywords };
}

exports.main = async (event) => {
  const userNote = event.userNote || '';
  const channelId = event.channelId || 'custom';
  let keywords = extractTokens(userNote);
  let summary = '已根据您的描述生成选品建议。';
  let mode = 'cloud_local';

  if (event.fileID) {
    try {
      const buffer = await downloadFileBuffer(event.fileID);
      const base64 = buffer.toString('base64');
      const visionText = await callOpenAIVision(base64, userNote);
      const parsed = parseVisionText(visionText);
      summary = parsed.summary;
      keywords = parsed.keywords.length ? parsed.keywords : keywords;
      mode = 'openai_vision';
    } catch (err) {
      summary =
        '图片已上传。当前未配置视觉 AI 密钥，已根据文字描述匹配产品。请在云函数环境变量配置 OPENAI_API_KEY。';
      if (!keywords.length) keywords = extractTokens(userNote || channelId);
    }
  }

  return {
    mode,
    summary,
    keywords,
    channelId
  };
};
