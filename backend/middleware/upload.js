const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Custom multer storage engine that streams directly to Cloudinary v2.
 * Replaces multer-storage-cloudinary which only supports cloudinary v1.
 */
function createCloudinaryStorage({ folder, resource_type, allowed_formats }) {
  return {
    _handleFile(req, file, cb) {
      const match = file.originalname.match(/\.([^.]+)$/);
      const ext = match ? match[1].toLowerCase() : '';

      const publicId = `${resource_type === 'video' ? 'clip' : 'img'}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;

      const options = {
        folder,
        resource_type,
        allowed_formats,
        public_id: publicId,
        chunk_size: 20000000, // 20 MB chunks for support of files > 100MB
      };

      if (ext && (!allowed_formats || allowed_formats.includes(ext))) {
        options.format = ext;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) return cb(error);
          // Mimic multer-storage-cloudinary's field names so existing route
          // code using getFileInfo() keeps working without changes.
          cb(null, {
            path: result.secure_url,       // file.path → secure URL
            filename: result.public_id,    // file.filename → public_id
            size: result.bytes,
          });
        }
      );

      file.stream.pipe(uploadStream);
    },

    _removeFile(req, file, cb) {
      cloudinary.uploader.destroy(file.filename, { resource_type }, cb);
    },
  };
}

// ── Storage instances ──────────────────────────────────────────────────────────

const videoStorage = createCloudinaryStorage({
  folder: 'videdit/uploads',
  resource_type: 'video',
  allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
});

const imageStorage = createCloudinaryStorage({
  folder: 'videdit/images',
  resource_type: 'image',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
});

const editedVideoStorage = createCloudinaryStorage({
  folder: 'videdit/edited',
  resource_type: 'video',
  allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
});

// ── Multer instances ───────────────────────────────────────────────────────────

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error('Only video files are allowed'), false);
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'), false);
  },
});

const uploadEditedVideo = multer({
  storage: editedVideoStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error('Only video files are allowed'), false);
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────────

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Max size is 500MB for videos, 10MB for images.' });
  }
  if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ message: err.message || 'Upload failed' });
  }
  next();
};

// Extract URL and public_id from uploaded file
// file.path = secure URL, file.filename = public_id (set by _handleFile above)
const getFileInfo = (file) => ({
  url: file.path,
  publicId: file.filename,
  originalName: file.originalname,
});

const deleteFromCloudinary = async (publicId, resourceType = 'video') => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = {
  uploadVideo,
  uploadImage,
  uploadEditedVideo,
  handleMulterError,
  getFileInfo,
  deleteFromCloudinary,
  cloudinary,
};
