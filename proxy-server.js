/**
 * Proxy server per sviluppo locale
 * Evita problemi CORS inoltrando le richieste al backend
 *
 * Uso: node proxy-server.js
 * Poi configura API_BASE_URL = 'http://localhost:3001' in config.ts
 */

const http = require('http');
const https = require('https');

const BACKEND_HOST = 'dev.ceposto.it';
const BACKEND_PORT = 16732;
const PROXY_PORT = 3001;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log(`[PROXY] ${req.method} ${req.url}`);

  // Collect request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${BACKEND_HOST}:${BACKEND_PORT}`,
      },
    };

    // Remove problematic headers
    delete options.headers['origin'];
    delete options.headers['referer'];

    const proxyReq = http.request(options, (proxyRes) => {
      // Add CORS to response
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      });

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[PROXY] Error:', err.message);
      res.writeHead(502);
      res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    });

    if (body) {
      proxyReq.write(body);
    }

    proxyReq.end();
  });
});

server.listen(PROXY_PORT, () => {
  console.log(`
====================================
  CORS Proxy Server Running
====================================
  Local:  http://localhost:${PROXY_PORT}
  Target: http://${BACKEND_HOST}:${BACKEND_PORT}
====================================

Configura in lib/config.ts:
  API_BASE_URL = 'http://localhost:${PROXY_PORT}'

Poi riavvia Expo.
`);
});
