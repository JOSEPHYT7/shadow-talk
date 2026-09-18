const http = require('http');
const https = require('https');

let keepAliveInterval = null;

/**
 * Starts the 24/7 infrastructure keep-alive heartbeat.
 * Pings the local /health endpoint and remote cloud URL periodically.
 * @param {number|string} port - Local server port.
 * @param {string} remoteUrl - Optional remote deployment health URL.
 */
function startKeepAlive(port = 5000, remoteUrl = process.env.KEEP_ALIVE_URL) {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }

  const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

  const doPing = () => {
    // 1. Local server ping
    try {
      const localReq = http.get(`http://localhost:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('[KeepAlive]: Local server health verified (200 OK).');
        }
      });
      localReq.on('error', (err) => {
        // Silently capture local connection glitches
      });
      localReq.setTimeout(5000, () => localReq.destroy());
    } catch (e) {
      // Ignore
    }

    // 2. Cloud remote ping (e.g. Render, Railway, Fly)
    const targetRemote = remoteUrl || 'https://shadow-talk-kryk.onrender.com/health';
    if (targetRemote && targetRemote.startsWith('https://')) {
      try {
        const remoteReq = https.get(targetRemote, (res) => {
          console.log(`[KeepAlive]: Cloud pulse: status ${res.statusCode}`);
        });
        remoteReq.on('error', () => {});
        remoteReq.setTimeout(8000, () => remoteReq.destroy());
      } catch (e) {
        // Ignore
      }
    }
  };

  // Initial ping after 30 seconds
  setTimeout(doPing, 30000);
  keepAliveInterval = setInterval(doPing, PING_INTERVAL);
  console.log('[KeepAlive]: 24/7 Server heartbeat service initialized.');
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('[KeepAlive]: Heartbeat service stopped.');
  }
}

module.exports = {
  startKeepAlive,
  stopKeepAlive
};
