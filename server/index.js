import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAiTutorHttp } from './aiTutorService.js';
import { loadServerEnv, getAiConfig } from './env.js';

/**
 * Kannada Mitra — Standalone Production HTTP Server
 * Serves static assets from dist/ and hosts the secure /api/ai-tutor endpoint.
 *
 * Usage:
 *   node server/index.js
 *   PORT=8080 node server/index.js
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

loadServerEnv(ROOT_DIR);
const config = getAiConfig();

const PORT = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. AI Tutor Backend API Endpoint
  if (pathname === '/api/ai-tutor' || pathname.startsWith('/api/ai-tutor/')) {
    try {
      await handleAiTutorHttp(req, res);
    } catch (err) {
      console.error('[Server] AI tutor handler error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' }));
      }
    }
    return;
  }

  // 2. Health check endpoint
  if (pathname === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', service: 'kannada-mitra', time: new Date().toISOString() }));
    return;
  }

  // 3. Static Assets from dist/
  if (fs.existsSync(DIST_DIR)) {
    let filePath = path.join(DIST_DIR, pathname);

    // Prevent directory traversal attacks
    if (!filePath.startsWith(DIST_DIR)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.statusCode = 200;
      res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA Fallback: serve index.html for client-side routing
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      fs.createReadStream(indexPath).pipe(res);
      return;
    }
  }

  // Fallback if dist/ has not been built yet
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`
    <!DOCTYPE html>
    <html>
      <head><title>Kannada Mitra Server</title></head>
      <body style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: auto;">
        <h2>Kannada Mitra Backend Active</h2>
        <p>API Endpoint: <code>/api/ai-tutor</code> is ready.</p>
        <p>To serve the frontend application, run <code>npm run build</code> first.</p>
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`[Kannada Mitra] Server listening on http://localhost:${PORT}`);
  console.log(`[Kannada Mitra] AI Tutor API: http://localhost:${PORT}/api/ai-tutor`);
  console.log(`[Kannada Mitra] Model: ${config.model} (${config.isConfigured ? 'Configured' : 'Missing AI_API_KEY'})`);
});
