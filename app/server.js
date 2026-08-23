#!/usr/bin/env node
'use strict';

const http = require('node:http');
const crypto = require('node:crypto');

const port = Number(process.env.PORT || 4173);
let cartCount = 0;

const loginPage = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Agent Shop — Login</title></head>
<body><main><h1>Agent Shop</h1><form id="login-form">
<label>Email <input name="email" type="email" required></label>
<label>Password <input name="password" type="password" required></label>
<button type="submit">Log in</button><p id="login-result" role="status"></p>
</form></main><script>
document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await fetch('/api/login', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
  const data = await response.json();
  document.querySelector('#login-result').textContent = data.ok ? 'Welcome, agent' : 'Invalid credentials';
});
</script></body></html>`;

const cartPage = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Agent Shop — Cart</title></head>
<body><main id="cart" data-pending="0"><h1>Cart</h1><p>Items: <strong id="cart-badge">0</strong></p>
<button id="add-item" type="button">Add field notebook</button></main><script>
let pending = 0;
let nextRequest = 0;
let latestPainted = 0;
async function addItem() {
  const requestId = ++nextRequest;
  pending += 1;
  document.querySelector('#cart').dataset.pending = String(pending);
  try {
    const response = await fetch('/api/cart/add', { method: 'POST' });
    const data = await response.json();
    if (requestId > latestPainted) {
      latestPainted = requestId;
      document.querySelector('#cart-badge').textContent = String(data.count);
    }
  } finally {
    pending -= 1;
    document.querySelector('#cart').dataset.pending = String(pending);
  }
}
document.querySelector('#add-item').addEventListener('click', addItem);
</script></body></html>`;

function inventoryCheck(snapshot) {
  return new Promise((resolve, reject) => {
    const iterations = snapshot % 2 === 0 ? 44000 : 45000;
    crypto.pbkdf2(`field-notebook-${snapshot}`, 'agent-shop-inventory', iterations, 32, 'sha256', (error) => {
      if (error) reject(error); else resolve();
    });
  });
}

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === 'GET' && (request.url === '/' || request.url === '/login')) {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return response.end(loginPage);
    }
    if (request.method === 'POST' && request.url === '/api/login') {
      const credentials = await readJson(request);
      return json(response, credentials.email === 'agent@example.test' && credentials.password === 'gate-ready' ? 200 : 401,
        { ok: credentials.email === 'agent@example.test' && credentials.password === 'gate-ready' });
    }
    if (request.method === 'GET' && request.url === '/cart') {
      cartCount = 0;
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return response.end(cartPage);
    }
    if (request.method === 'POST' && request.url === '/api/cart/add') {
      cartCount += 1;
      const snapshot = cartCount;
      await inventoryCheck(snapshot);
      return json(response, 200, { count: snapshot });
    }
    response.writeHead(404).end('Not found');
  } catch (error) {
    json(response, 500, { error: error.message });
  }
});

server.listen(port, '127.0.0.1', () => console.log(`Agent Shop listening on http://127.0.0.1:${port}`));
