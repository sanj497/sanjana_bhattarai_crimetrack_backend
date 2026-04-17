import multer from "multer";

// Use memory storage instead of multer-storage-cloudinary
// Files are kept in memory as buffers, then uploaded to Cloudinary
// in the controller via the cloudinary SDK directly.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/jpg", "image/png", "application/pdf",
    "video/mp4", "video/webm", "video/x-matroska", "video/quicktime"
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only jpg, png, pdf, mp4, webm, mkv, or mov allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
});
