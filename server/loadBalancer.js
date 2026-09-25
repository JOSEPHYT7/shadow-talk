/**
 * ShadowTalk Edge Reverse-Proxy & HTTP/WebSocket Load Balancer
 * Distributes network load across backend node replicas using weighted round-robin
 * with sticky session hashing (required for Socket.IO stateful handshakes).
 */

const http = require('http');
const httpProxy = require('http');

const LB_PORT = process.env.LB_PORT || 8080;
const BACKEND_TARGETS = (process.env.BACKEND_TARGETS || 'http://127.0.0.1:5000')
  .split(',')
  .map(t => t.trim())
  .filter(Boolean);

let requestCounter = 0;

/**
 * Hash client IP to select sticky target for Socket.IO polling & upgrade handshakes
 */
function getStickyTarget(clientIp) {
  let hash = 0;
  for (let i = 0; i < clientIp.length; i++) {
    hash = (hash << 5) - hash + clientIp.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % BACKEND_TARGETS.length;
  return BACKEND_TARGETS[index];
}

const server = http.createServer((req, res) => {
  requestCounter++;
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  const targetUrl = new URL(getStickyTarget(clientIp));

  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || 5000,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      'x-forwarded-for': clientIp,
      'x-forwarded-proto': 'http',
      'x-load-balancer': 'ShadowTalk-Edge-LB-v2',
      'x-lb-request-id': `req_${Date.now()}_${requestCounter}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[Load Balancer Error]: Proxy connection to ${targetUrl.host} failed:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Load Balancer Bad Gateway',
        message: 'All backend cluster nodes currently undergoing high load or maintenance. Retrying...'
      }));
    }
  });

  req.pipe(proxyReq);
});

// WebSocket Upgrade Forwarding
server.on('upgrade', (req, socket, head) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || socket.remoteAddress || '127.0.0.1';
  const targetUrl = new URL(getStickyTarget(clientIp));

  const proxyReq = http.request({
    hostname: targetUrl.hostname,
    port: targetUrl.port || 5000,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      'x-forwarded-for': clientIp,
      'x-load-balancer': 'ShadowTalk-Edge-LB-WS'
    }
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
      Object.entries(proxyRes.headers)
        .map(([k, v]) => `${k}: ${v}\r\n`)
        .join('') +
      '\r\n'
    );
    if (proxyHead && proxyHead.length) socket.unshift(proxyHead);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on('error', (err) => {
    console.error('[Load Balancer WS Error]:', err.message);
    socket.destroy();
  });

  proxyReq.end();
});

server.listen(LB_PORT, () => {
  console.log(`[Load Balancer]: Active on port ${LB_PORT}, routing to: ${BACKEND_TARGETS.join(', ')}`);
});
