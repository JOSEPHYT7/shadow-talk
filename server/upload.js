const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadLimiter } = require('./middleware/rateLimiter');
const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Prohibited executable and server-side script extensions
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs',
  '.js', '.mjs', '.cjs', '.php', '.phtml', '.php3', '.php4', '.php5',
  '.cgi', '.pl', '.py', '.asp', '.aspx', '.jsp', '.jspx',
  '.dll', '.so', '.dylib', '.com', '.scr', '.msi', '.hta', '.jar'
]);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const cleanExt = DANGEROUS_EXTENSIONS.has(rawExt) ? '.bin' : rawExt;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + cleanExt);
  }
});

function fileFilter(req, file, cb) {
  const rawExt = path.extname(file.originalname || '').toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(rawExt)) {
    return cb(new Error('Executable and server-side script file uploads are prohibited for security.'));
  }
  cb(null, true);
}

const maxUploadMb = parseInt(process.env.UPLOAD_MAX_MB, 10) || 50;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxUploadMb * 1024 * 1024, // 50MB default
    files: 5
  }
});

const handleUpload = (req, res) => {
  const file = req.file || (req.files && req.files[0]);
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  let safeOriginalName = 'file';
  try {
    const raw = Buffer.from(file.originalname || 'file', 'latin1').toString('utf8');
    // Strip path separators, null bytes, and control characters
    safeOriginalName = path.basename(raw).replace(/[\0\r\n\t]/g, '').trim() || 'file';
  } catch {
    safeOriginalName = 'file';
  }

  const fileUrl = `/uploads/${file.filename}`;
  res.json({
    fileUrl,
    imageUrl: fileUrl,
    fileName: safeOriginalName,
    fileType: file.mimetype || 'application/octet-stream',
    fileSize: file.size,
    uploadedAt: Date.now()
  });
};

// Accept uploads with rate limiting protection
router.post('/', uploadLimiter, upload.any(), handleUpload);
router.post('/image', uploadLimiter, upload.any(), handleUpload);

// Multer error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message || 'File upload rejected' });
  }
  next();
});

module.exports = router;