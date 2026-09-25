#!/usr/bin/env node

/**
 * =========================================================================
 * ShadowTalk - Chat Clearance & Maintenance Script
 * =========================================================================
 *
 * Clears all chat messages, attached media uploads, and optionally
 * resets James AI conversation memory.
 *
 * Works in two modes automatically:
 * 1. LIVE SERVER (Online):
 *    If the backend server is running, sends a maintenance request to
 *    clear in-memory messages, delete attachments, and broadcast an instant
 *    `allMessages: []` & `chatCleared` event to all connected browser clients.
 *
 * 2. OFFLINE FILESYSTEM:
 *    If the server is stopped, directly wipes `server/data/messages.json`
 *    and cleans files inside `server/uploads/` (preserving `.gitkeep`).
 *
 * Usage:
 *   node clearChat.js [options]
 *   npm run clear:chat [options]
 *
 * Options:
 *   --keep-uploads      Keep uploaded media files in server/uploads/
 *   --james             Also reset James AI conversation history & topics
 *   --all               Clear messages, uploads, and James AI memory
 *   --port <number>     Server port (default: 5000 or process.env.PORT)
 *   --help, -h          Display this help message
 * =========================================================================
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Paths relative to this script in server/
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const JAMES_MEMORY_FILE = path.join(DATA_DIR, 'james_memory.json');

// Parse CLI arguments
const args = process.argv.slice(2);

const showHelp = args.includes('--help') || args.includes('-h');
const keepUploads = args.includes('--keep-uploads');
const clearJames = args.includes('--james') || args.includes('--all');
const isAll = args.includes('--all');

let targetPort = process.env.PORT || 5000;
const portIdx = args.findIndex(a => a === '--port');
if (portIdx !== -1 && args[portIdx + 1]) {
  targetPort = parseInt(args[portIdx + 1], 10) || targetPort;
} else {
  const inlinePort = args.find(a => a.startsWith('--port='));
  if (inlinePort) {
    targetPort = parseInt(inlinePort.split('=')[1], 10) || targetPort;
  }
}

// Colors for terminal output
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const dim = '\x1b[2m';
const bold = '\x1b[1m';
const reset = '\x1b[0m';

if (showHelp) {
  console.log(`
${cyan}${bold}======================================================
  ⚡ SHADOWTALK - CHAT CLEARANCE SCRIPT
======================================================${reset}

${bold}Usage:${reset}
  node clearChat.js [options]
  npm run clear:chat [options]

${bold}Options:${reset}
  ${cyan}--keep-uploads${reset}    Preserve media files in server/uploads/
  ${cyan}--james${reset}           Also reset James AI conversation history
  ${cyan}--all${reset}             Clear messages, uploads, and James AI memory
  ${cyan}--port <num>${reset}      Backend server port (default: 5000)
  ${cyan}--help, -h${reset}        Show this guide

${bold}Examples:${reset}
  node clearChat.js               ${dim}# Default: wipes messages & uploads${reset}
  node clearChat.js --keep-uploads ${dim}# Wipes messages only${reset}
  node clearChat.js --all         ${dim}# Wipes messages, uploads & James memory${reset}
`);
  process.exit(0);
}

/**
 * Attempt to clear chat via live server HTTP endpoint
 */
function tryOnlineClear() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      keepUploads,
      clearJames
    });

    const options = {
      hostname: '127.0.0.1',
      port: targetPort,
      path: '/api/chat/clear',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 2500
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ success: true });
          }
        } else {
          reject(new Error(`Server returned HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timed out'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Offline direct filesystem cleanup fallback
 */
function runOfflineClear() {
  console.log(`${yellow}[Offline Mode]:${reset} Server is not running on port ${targetPort}. Performing direct filesystem cleanup...`);

  let messagesCount = 0;

  // 1. Wipe messages.json
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(MESSAGES_FILE)) {
      try {
        const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) messagesCount = parsed.length;
      } catch {}
    }

    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf8');
    console.log(`  ${green}✓${reset} Cleared ${bold}${messagesCount}${reset} messages from ${dim}${MESSAGES_FILE}${reset}`);
  } catch (err) {
    console.error(`  ${red}✗${reset} Failed to clear messages.json: ${err.message}`);
  }

  // 2. Clean uploads directory
  let deletedFilesCount = 0;
  if (!keepUploads) {
    try {
      if (fs.existsSync(UPLOADS_DIR)) {
        const files = fs.readdirSync(UPLOADS_DIR);
        files.forEach(file => {
          if (file === '.gitkeep') return;
          const fullPath = path.join(UPLOADS_DIR, file);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
              fs.unlinkSync(fullPath);
              deletedFilesCount++;
            }
          } catch {}
        });
        console.log(`  ${green}✓${reset} Purged ${bold}${deletedFilesCount}${reset} uploaded files from ${dim}${UPLOADS_DIR}${reset}`);
      }
    } catch (err) {
      console.error(`  ${red}✗${reset} Failed to clean uploads directory: ${err.message}`);
    }
  } else {
    console.log(`  ${yellow}ℹ${reset} Uploads directory skipped (--keep-uploads was passed)`);
  }

  // 3. Clear James AI short-term conversation buffer if requested
  if (clearJames) {
    try {
      if (fs.existsSync(JAMES_MEMORY_FILE)) {
        const raw = fs.readFileSync(JAMES_MEMORY_FILE, 'utf8');
        const memoryData = JSON.parse(raw);
        memoryData.conversationHistory = [];
        memoryData.topics = [];
        memoryData.summary = '';
        memoryData.updatedAt = Date.now();
        fs.writeFileSync(JAMES_MEMORY_FILE, JSON.stringify(memoryData, null, 2), 'utf8');
        console.log(`  ${green}✓${reset} Reset James AI conversation history & topics in ${dim}${JAMES_MEMORY_FILE}${reset}`);
      }
    } catch (err) {
      console.error(`  ${red}✗${reset} Failed to reset James AI memory: ${err.message}`);
    }
  }

  console.log(`\n${green}${bold}✨ Chat cleared successfully on disk!${reset}`);
  console.log(`${dim}Next time you launch the server (npm run dev), chat will start 100% fresh.${reset}\n`);
}

/**
 * Main execution flow
 */
async function main() {
  console.log(`\n${cyan}${bold}==============================================${reset}`);
  console.log(`${cyan}${bold}  🧹 ShadowTalk - Chat Clearance Initiated    ${reset}`);
  console.log(`${cyan}${bold}==============================================${reset}\n`);

  try {
    const result = await tryOnlineClear();
    console.log(`${green}${bold}[Online Live Sync]:${reset} Successfully connected to running server on port ${targetPort}!`);
    console.log(`  ${green}✓${reset} Cleared ${bold}${result.clearedCount ?? 0}${reset} messages from server memory and disk`);
    if (!keepUploads) {
      console.log(`  ${green}✓${reset} Purged ${bold}${result.deletedFilesCount ?? 0}${reset} attached files from uploads/`);
    } else {
      console.log(`  ${yellow}ℹ${reset} Uploads preserved (--keep-uploads)`);
    }
    if (clearJames) {
      console.log(`  ${green}✓${reset} Reset James AI conversation memory`);
    }
    console.log(`  ${green}✓${reset} Broadcasted real-time wipe to all connected browser clients!`);
    console.log(`\n${green}${bold}✨ Chat cleared live! All connected users see an empty chat immediately.${reset}\n`);
  } catch (err) {
    // If connection refused or server offline, fall back to offline disk clear
    if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED') || err.message.includes('timed out')) {
      runOfflineClear();
    } else {
      console.log(`${yellow}Notice: Server request failed (${err.message}). Falling back to disk cleanup...${reset}`);
      runOfflineClear();
    }
  }
}

main();
