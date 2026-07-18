import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export function cloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function configureCloudinary() {
  if (!cloudinaryConfigured()) throw new Error("Cloudinary is not configured.");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export async function uploadProductImage(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return new Promise<UploadApiResponse>((resolve, reject) => {
    configureCloudinary().uploader.upload_stream({
      folder: "carnival-of-clothes/products",
      resource_type: "image",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    }, (error, result) => {
      if (error || !result) reject(error || new Error("Cloudinary upload failed."));
      else resolve(result);
    }).end(bytes);
  });
}
