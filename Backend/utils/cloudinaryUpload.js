import cloudinary from "../config/cloudinary.js";

/**
 * Upload a multer file buffer to Cloudinary.
 *
 * @param {Object} file - multer file object (from memoryStorage)
 * @param {string} file.buffer - the file buffer
 * @param {string} file.mimetype - MIME type
 * @param {string} file.originalname - original filename
 * @returns {Promise<{url: string, publicId: string, resourceType: string}>}
 */
export const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const isPdf = file.mimetype === "application/pdf";
    const isVideo = file.mimetype.startsWith("video/");
    const resourceType = isPdf ? "raw" : (isVideo ? "video" : "image");
    const publicId = `${Date.now()}-${file.originalname.split(".")[0]}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "crime-track/evidence",
        resource_type: resourceType,
        public_id: publicId,
        allowed_formats: ["jpg", "jpeg", "png", "pdf", "mp4", "webm", "mkv", "mov"],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};
