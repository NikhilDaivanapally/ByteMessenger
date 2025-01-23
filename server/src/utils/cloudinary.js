import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log('file uploaded on cloudinary',response.url)
    fs.unlinkSync(localFilePath)
    return response
  } catch (error) {

    // remove the locally saved temporay file as the upload got failed
    fs.unlinkSync(localFilePath)
  }
};

export { uploadCloudinary };
