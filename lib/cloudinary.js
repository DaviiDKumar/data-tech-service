import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadToCloudinary(file, userId, filePrefix) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const isPdf = file.type === "application/pdf" || file.name?.endsWith(".pdf");

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `KYC_Records/${userId}`,
        public_id: `${filePrefix}_${Date.now()}`,
        resource_type: isPdf ? "raw" : "image", 
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}