const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 100 * 1024 * 1024, // Use env var or default to 100MB
    files: 1 // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    console.log('Attempting to upload file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Validate file name
    const fileName = file.originalname;
    if (fileName.length > 200) {
      const error = new Error('File name exceeds 200 characters');
      error.code = 'INVALID_FILE_NAME';
      cb(error, false);
      return;
    }

    if (/[<>:"/\\|?*\x00-\x1F]/.test(fileName)) {
      const error = new Error('File name contains invalid characters');
      error.code = 'INVALID_FILE_NAME';
      cb(error, false);
      return;
    }

    // Accept all file types
    cb(null, true);
  }
});

module.exports = upload; 