import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/main.js': ['main.js', 'text/javascript; charset=utf-8'],
  '/recommendation.js': ['recommendation.js', 'text/javascript; charset=utf-8'],
};
createServer(async (request, response) => {
  const file = files[new URL(request.url, 'http://localhost').pathname];
  if (!file) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const content = await readFile(new URL(`../dist/${file[0]}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': file[1] }).end(content);
  } catch {
    response.writeHead(500).end('Run npm run build first.');
  }
}).listen(4173, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173'));
