const multer = require('multer');

// Store files in memory buffer for immediate processing and streaming to Cloudinary
const storage = multer.memoryStorage();

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file

/**
 * Filter to validate uploaded file formats
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Unsupported file type: ${file.mimetype}. Allowed types are JPEG, PNG, and WebP.`
    );
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

// Preset for Report creation: up to 3 images in field 'images'
const uploadReportImages = upload.array('images', 3);

// Preset for Repair completion: up to 3 beforeImages and 3 afterImages
const uploadRepairImages = upload.fields([
  { name: 'beforeImages', maxCount: 3 },
  { name: 'afterImages', maxCount: 3 }
]);

/**
 * Wrapper middleware to handle Multer errors gracefully
 */
const handleUpload = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File size limit exceeded. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB per image.`
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Unexpected file field or too many files uploaded. ${err.message}`
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

module.exports = {
  upload,
  uploadReportImages: handleUpload(uploadReportImages),
  uploadRepairImages: handleUpload(uploadRepairImages)
};

