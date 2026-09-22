import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enrichLeadWebsite, getRuntimeStatus, searchLeads } from './lib/engine.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]
]);

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, getRuntimeStatus());
    }

    if (req.method === 'POST' && url.pathname === '/api/search') {
      const body = await readBody(req);
      const result = await searchLeads(body.keyword, body.city);
      return json(res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/api/enrich') {
      const body = await readBody(req);
      const result = await enrichLeadWebsite(body.website, body.lead || {});
      return json(res, 200, result);
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && assets.has(url.pathname)) {
      const [file, type] = assets.get(url.pathname);
      const content = await fs.readFile(path.join(root, file));
      res.writeHead(200, { 'Content-Type': type });
      return req.method === 'HEAD' ? res.end() : res.end(content);
    }

    if (req.method === 'GET') {
      const content = await fs.readFile(path.join(root, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(content);
    }

    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    return json(res, error.statusCode || 500, { error: error.message || 'Erro interno' });
  }
});

server.listen(port, () => {
  const status = getRuntimeStatus();
  console.log(`HunterX rodando em http://localhost:${port}`);
  console.log(`Provider: ${status.provider}${status.provider === 'live' ? (status.liveReady ? ' (configurado)' : ' (SEM CHAVE)') : ''}`);
});
