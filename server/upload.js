const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanExt = path.extname(file.originalname || '') || '';
    cb(null, uniqueSuffix + cleanExt);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  }
});

const handleUpload = (req, res) => {
  const file = req.file || (req.files && req.files[0]);
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  let safeOriginalName = file.originalname || 'file';
  try {
    safeOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  } catch {
    // fallback
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

// Accept any field name (file, image, attachment, etc.)
router.post('/', upload.any(), handleUpload);
router.post('/image', upload.any(), handleUpload);

// Multer error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
  next();
});

module.exports = router;