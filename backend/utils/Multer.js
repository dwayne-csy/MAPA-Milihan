const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Temporary upload folder
const tmpDir = path.join(os.tmpdir(), 'Mapa-Milihan-uploads');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
  console.log('📁 Created upload directory:', tmpDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = base + ext;
    console.log(`📝 Saving file as: ${filename}`);
    cb(null, filename);
  }
});

// File filter - allow images and videos
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
    'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff'
  ];
  
  const allowedVideoTypes = [
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
    'video/x-msvideo', 'video/avi', 'video/ogg', 'video/3gpp',
    'video/x-flv', 'video/x-ms-wmv'
  ];
  
  const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  
  if (allAllowedTypes.includes(file.mimetype)) {
    console.log(`✅ File accepted: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
  } else {
    console.log(`❌ File rejected: ${file.originalname} (${file.mimetype})`);
    cb(new Error(`Only image and video files are allowed! Received: ${file.mimetype}`), false);
  }
};

// Create multer instance - INCREASED LIMITS
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 10 // Max 10 files
  }
});

module.exports = upload;