const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const MS_24_HOURS = 24 * 60 * 60 * 1000;

function cleanupUploads() {
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (Date.now() - stats.mtimeMs > MS_24_HOURS) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}

function cleanupMessages(messages) {
  const now = Date.now();
  return messages.filter(msg => now - msg.timestamp < MS_24_HOURS);
}

module.exports = { cleanupUploads, cleanupMessages }; 