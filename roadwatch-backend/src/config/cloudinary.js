const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Checks whether live Cloudinary credentials are fully configured
 */
const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return name && key && secret && name !== 'demo' && !name.includes('<');
};

/**
 * Uploads a file buffer directly to Cloudinary via a stream.
 * In development or when credentials are demo/unset, safely returns a structured mock object.
 * 
 * @param {Buffer} buffer - File buffer from Multer memoryStorage
 * @param {string} folder - Target Cloudinary folder (e.g. 'roadwatch/reports')
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadToCloudinary = (buffer, folder = 'roadwatch') => {
  return new Promise((resolve, reject) => {
    // Graceful fallback for offline testing or unconfigured Cloudinary
    if (!isCloudinaryConfigured()) {
      const mockId = `mock_${folder.replace('/', '_')}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return resolve({
        url: `https://res.cloudinary.com/demo/image/upload/sample.jpg`,
        publicId: mockId
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    // Write buffer directly to stream without streamifier dependency if preferred,
    // using native Node stream.PassThrough or Readable
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Deletes an asset from Cloudinary by its publicId
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId || publicId.startsWith('mock_')) {
    return { result: 'ok (mock)' };
  }
  return cloudinary.uploader.destroy(publicId);
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured
};

