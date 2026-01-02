const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base upload directory - absolute path
const baseUploadPath = path.join(__dirname, '../../uploads');

// Ensure upload directories exist
const ensureDirectories = () => {
  const dirs = [
    path.join(baseUploadPath, 'images'),
    path.join(baseUploadPath, 'videos'),
    path.join(baseUploadPath, 'audios'),
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize directories
ensureDirectories();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = baseUploadPath;

    // Check the file's MIME type
    if (file.mimetype.startsWith('image')) {
      uploadPath = path.join(baseUploadPath, 'images');
    } else if (file.mimetype.startsWith('video')) {
      uploadPath = path.join(baseUploadPath, 'videos');
    } else if (file.mimetype.startsWith('audio')) {
      uploadPath = path.join(baseUploadPath, 'audios');
    } else {
      return cb(new Error('Invalid file type'));
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

// Initialize multer with the configured storage
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

module.exports = upload;
