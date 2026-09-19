const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const MS_24_HOURS = 24 * 60 * 60 * 1000;

function cleanupUploads() {
  if (!fs.existsSync(UPLOADS_DIR)) return;
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (now - stats.mtimeMs > MS_24_HOURS) {
          fs.unlink(filePath, (unlinkErr) => {
            if (!unlinkErr) {
              console.log(`[24h Cleanup]: Purged expired file from uploads: ${file}`);
            }
          });
        }
      });
    });
  });
}

function cleanupMessages(messages) {
  const now = Date.now();
  return (messages || []).filter(msg => (now - (msg.timestamp || 0)) < MS_24_HOURS);
}

module.exports = { cleanupUploads, cleanupMessages };