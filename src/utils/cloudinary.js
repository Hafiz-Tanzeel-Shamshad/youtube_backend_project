import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


// Configuration
cloudinary.config({ 
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    api_key:  process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload an image
const uploadOnCloudinary = async(localFilePath)=>{
    try {
        if (!localFilePath) return null;
        //upload the file on cloudinary
       const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
            folder: "youtube_images",
            media_metadata: true, // 
        })
        // file has been uploaded successfully
        console.log("file is uploaded successfully", response.secure_url);

        // delete local temp file after successful upload
        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        // delete local file if upload failed
       fs.unlinkSync(localFilePath);
       return null;   
    }
}

export {uploadOnCloudinary};