import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

 export async function uploadToCloudinary(file, userId, type) {
  if (!file || file.size === 0) return null;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `KYC_Records/${userId}`,
        resource_type: "image",    // Enables browser preview
        format: "pdf",             // Preserves document quality
        flags: "attachment:false", // Prevents forced download
        public_id: `${type}_${Date.now()}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    ).end(buffer);
  });
}
