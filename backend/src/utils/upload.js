const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "glowsphere",
    allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "pdf"],
    transformation: [{ width: 1200, height: 1200, crop: "limit" }],
  },
});

// Create multer instance
const upload = multer({ storage: storage });

// Upload file to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    // Check if Cloudinary is configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      // Fallback to local file URL
      return {
        secure_url: `/uploads/${file.filename}`,
        public_id: file.filename,
        resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
      };
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "glowsphere",
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    // Fallback to local file URL if Cloudinary fails
    console.warn("Cloudinary upload failed, using local file:", error.message);
    return {
      secure_url: `/uploads/${file.filename}`,
      public_id: file.filename,
      resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
    };
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error("File deletion failed: " + error.message);
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
};
