const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const MS_24_HOURS = 24 * 60 * 60 * 1000;

/**
 * Safely delete an uploaded file given its relative URL or filename.
 */
function deleteUploadedFile(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  try {
    const match = fileUrl.match(/\/uploads\/([^/?#]+)/);
    const filename = match ? path.basename(match[1]) : path.basename(fileUrl);
    const fullPath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlink(fullPath, (err) => {
        if (!err) console.log(`[File Cleanup]: Deleted ${filename}`);
      });
    }
  } catch (e) {
    console.error('[File Cleanup Error]:', e.message);
  }
}

/**
 * Clean up files in server/uploads older than 24 hours, or orphaned files older than 2 hours.
 */
function cleanupUploads(activeMessages = []) {
  if (!fs.existsSync(UPLOADS_DIR)) return;

  // Build a set of filenames currently referenced by active messages
  const referencedFilenames = new Set();
  if (Array.isArray(activeMessages)) {
    activeMessages.forEach(m => {
      if (!m) return;
      ['fileUrl', 'audioUrl', 'imageUrl', 'videoUrl'].forEach(key => {
        if (m[key] && typeof m[key] === 'string') {
          const match = m[key].match(/\/uploads\/([^/?#]+)/);
          if (match && match[1]) referencedFilenames.add(match[1]);
        }
      });
      if (m.replyTo) {
        ['fileUrl', 'audioUrl', 'imageUrl', 'videoUrl'].forEach(key => {
          if (m.replyTo[key] && typeof m.replyTo[key] === 'string') {
            const match = m.replyTo[key].match(/\/uploads\/([^/?#]+)/);
            if (match && match[1]) referencedFilenames.add(match[1]);
          }
        });
      }
    });
  }

  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach(file => {
      // Don't delete .gitkeep
      if (file === '.gitkeep') return;

      const filePath = path.join(UPLOADS_DIR, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) return;

        const ageMs = now - Math.min(stats.mtimeMs || now, stats.birthtimeMs || now);
        const isExpired = ageMs > MS_24_HOURS;
        const isOrphaned = referencedFilenames.size > 0 && !referencedFilenames.has(file) && (ageMs > 2 * 60 * 60 * 1000);

        if (isExpired || isOrphaned) {
          fs.unlink(filePath, (unlinkErr) => {
            if (!unlinkErr) {
              console.log(`[24h Cleanup]: Purged file (${isExpired ? 'expired >24h' : 'orphaned'}): ${file}`);
            }
          });
        }
      });
    });
  });
}

/**
 * Clean up messages older than 24 hours, including all user and James AI messages.
 * Automatically deletes any file attachments linked to expired messages.
 */
function cleanupMessages(messages) {
  const now = Date.now();
  const valid = [];
  const expired = [];

  (messages || []).forEach(msg => {
    if (!msg) return;
    const age = now - (msg.timestamp || 0);
    if (age < MS_24_HOURS) {
      valid.push(msg);
    } else {
      expired.push(msg);
    }
  });

  // Automatically delete any files attached to expired messages from server/uploads
  if (expired.length > 0) {
    expired.forEach(msg => {
      ['fileUrl', 'audioUrl', 'imageUrl', 'videoUrl'].forEach(prop => {
        if (msg[prop]) deleteUploadedFile(msg[prop]);
      });
    });
    console.log(`[24h Cleanup]: Purged ${expired.length} expired messages (>24h old, including James messages).`);
  }

  return valid;
}

module.exports = { cleanupUploads, cleanupMessages, deleteUploadedFile, MS_24_HOURS };