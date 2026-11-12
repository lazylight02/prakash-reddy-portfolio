// Dedicated Server for Prakash Reddy Portfolio
// Serves the frontend assets, provides security headers, and handles HTTP routing.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = fileURLToPath(new URL('.', import.meta.url));

// Resolve frontend directory reliably whether run from inside backend/, root, or subfolder
const candidateFrontend = resolve(currentDir, './frontend');
const candidateParentFrontend = resolve(currentDir, '../frontend');
const frontendDir = existsSync(candidateFrontend)
  ? candidateFrontend
  : (existsSync(candidateParentFrontend) ? candidateParentFrontend : currentDir);

const safeRoot = frontendDir.endsWith(sep) ? frontendDir : frontendDir + sep;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

const port = Number(process.env.PORT) || 8080;

const server = createServer(async (request, response) => {
  // Only accept GET and HEAD methods
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { 'Content-Type': 'text/plain' });
    response.end('Method Not Allowed');
    return;
  }

  let pathname = '/';
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname);
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain' });
    response.end('Bad Request');
    return;
  }

  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = resolve(safeRoot, relative);

  // Path traversal prevention: strictly enforce path stays inside safeRoot
  if (!file.startsWith(safeRoot) && file !== frontendDir) {
    response.writeHead(403, { 'Content-Type': 'text/plain' });
    response.end('Forbidden');
    return;
  }

  try {
    const body = await readFile(file);
    const ext = extname(file).toLowerCase();
    const contentType = mime[ext] || 'application/octet-stream';

    response.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': Buffer.byteLength(body),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });

    if (request.method === 'HEAD') {
      response.end();
    } else {
      response.end(body);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    } else {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Internal Server Error');
    }
  }
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please stop the existing process or use another port: PORT=8081 node server.js`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

server.listen(port, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Prakash Reddy Portfolio Server Running!`);
  console.log(`🌐 Local URL:  http://localhost:${port}`);
  console.log(`📁 Serving:    ${frontendDir}`);
  console.log(`==================================================\n`);
});
