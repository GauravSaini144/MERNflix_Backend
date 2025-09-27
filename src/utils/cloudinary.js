import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv"
import { ApiError } from './ApiError.js';
dotenv.config();
 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET 
    });
    

    const uploadOnCloudinary = async(localFilePath)=>{
        try {
            console.log("entering in uploadOnCloudinary function");
            if(!localFilePath){
             console.log("cloudinary local file path not found, now returning");
            return null;
        }

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
        });

        // file uploaded
        fs.unlinkSync(localFilePath);
        console.log("file uploaded on cloudinary", response);
        return response;
        } 
        
        catch (error) {
        fs.unlinkSync(localFilePath); // removing locally saved file on server
         
        console.log("error while uploading file on cloudinary...", error);

        return null;
            
        }
    }


    const deleteOnCloudinary = async(fileUrl, type)=>{
        try {

            if(!fileUrl){
                throw new ApiError(400, "file url required to delete image");
            }
        //   extracting name of file from url

         const parts = fileUrl.split('/');
         const fileName = parts.pop();
         const publicId = fileName.split('.')[0];

         
        const result = await cloudinary.uploader.destroy(publicId,{
            resource_type:type,
            invalidate:true});

        return result;
            
        } catch (error) {
            throw new ApiError(500, "Error while destroying image >><><<<<>>> ", error);
        }
    }

    export {uploadOnCloudinary, deleteOnCloudinary};