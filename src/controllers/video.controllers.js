import {Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
const uploadVideo = asyncHandler(async(req, res)=>{
   
   const {title, description} = req.body;
   
   const videoLocalPath = req.files?.video[0].path;
   const thumbnailLocalPath = req.files?.thumbnail[0].path;
    
   if(!title?.trim()){
    throw new ApiError(400, "video title required");
   }
   if(!description?.trim()){
    throw new ApiError(400, "Video description required");
   }

   if(!videoLocalPath){
    throw new ApiError(400, "Video required");

   }
   if(!thumbnailLocalPath){
    throw new ApiError(400, "Thumbnail required");
   }


   const videoResponse = await uploadOnCloudinary(videoLocalPath);
   const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath);

   if(!videoResponse.url){
    throw new ApiError(500, "Error while uploading video on cloudinary");
   }
   
   if(!thumbnailResponse.url){
    throw new ApiError(500, "Error while uploading thumbnail image on cloudinary");
   }

   const video = await Video.create({
    videoFile:videoResponse.url,
    thumbnail:thumbnailResponse.url,
    title:title,
    description:description,
    duration:videoResponse.duration,
    owner:req.user._id
   });

   if(!video){
      throw new ApiError(500, "Something went wrong, Error while creating video");
   }

   return res.status(200).json(
    new ApiResponse(200, video, "Video Uploaded Successfully")
   );

});


const getVideoFromId =asyncHandler(async(req, res)=>{
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400, "Video Id not found");

    }

   const video  = await Video.aggregate([
    {
        $match:{
            _id:new mongoose.Types.ObjectId(videoId)
        }
    },
    
    {
        $lookup:{
            from:"likes",
            localField: "_id",
            foreignField: "video",
            as:"likes"
        }
    },
    {
     $lookup:{
        from:"subscriptions",
        localField:"owner",
        foreignField:"channel",
        as:"subscribers",
     }
    },
    {
        $lookup:{
            from :"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {
                    $project:{
                        username:1,
                        fullname:1,
                        avatar:1,
                    }
                }
            ]
        }
    },
    { $lookup:{
      from:"views",
      localField:"_id",
      foreignField:"video",
      as:"totalViews",
    }
    },
    

    {

        $addFields:{
            likes:{
                $size:"$likes",
            },
            subscribers:{
                $size:"$subscribers",
            },
            owner:{"$first" :"$owner"},
            isLiked:{
                $cond:{
                    if:{$in:[new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"]},
                    then:true,
                    else:false,
                }
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[new mongoose.Types.ObjectId(req.user._id), "$subscribers.subscriber"]},
                    then:true,
                    else:false,
                }
            }
            ,

            totalViews:{
                $size:"$totalViews",
            }
        },

    },
    
   ]);
    

   if(!video[0]){
    throw new ApiError(404, "Video not found");
   }

   return res.status(200).json( new ApiResponse(200, video," Video fetched successfully"))



    // const video =await Video.findById(videoId);
    
    // if(!video){
    //     throw new ApiError(400, "Video not found or may deleted ");
    // }

    // return res.status(200).json(
    //     new ApiResponse(200, video, "Video found Successfully")
    // )



}) 

const updateVideo = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;
    
    if(!videoId){
        throw new ApiError(400, "Video id required");
    }
    const video = await Video.findById(videoId);
     
    if(!video){
        throw new ApiError(404, "Video not found or may deleted");
    }

    if(video.owner.toString()!==req.user.id.toString()){
        
        throw new ApiError(401, "Unauthorized Request to update video");
    }
    const previousThumbnail = video.thumbnail;
    const {title, description} = req.body;
  
    const thumbnailLocalPath = req.file?.path;
    if(thumbnailLocalPath){
    
        const response = await uploadOnCloudinary(thumbnailLocalPath);
           
        if(response?.url){
         const result = await deleteOnCloudinary(previousThumbnail);
        }
        

        video.thumbnail = response.url;
        
        await video.save({validateBeforeSave:false});
        
        
    }
  
    // if not thumbnail 
    
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description
            }
        },
         {
            new:true
        },
        {
            validateBeforeSave:false,
        },
       
    );


    if(!updatedVideo){
        throw new ApiError(500, "Error in finding and updating video");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )

});

const deleteVideo = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;
   
    if(!videoId){
        throw new ApiError(400, "Video id required");

    }

    // autheticating the video owner 

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "video now found or may deleted");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "Unauthorized request to delete video");
    }

     // deleting video and thumbnail on cloudinary
    const videoResult = await deleteOnCloudinary(video.videoFile, "video");
    const thumbnailResult = await deleteOnCloudinary(video.thumbnail, "image");

    // deleting the document

    const response = await Video.findByIdAndDelete(videoId);

    if(!response){
        throw new ApiError(500, "Video not found to delete ");
    }

    return res.status(200).json(
        new ApiResponse(200, response, "Video Deleted Successfully")
    )

});

const togglePublishStatus = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400, "Video ID required");
        
    }

    const video  = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found or may deleted");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "Unauthorized request to update video");
    }

    if(video.isPublished===true){
        video.isPublished=false;
    }
    else{
        video.isPublished=true;
    }

    await video.save({validateBeforeSave:false});

    

    return res.status(200).json(
        new ApiResponse(200, "publish status of video updated successfully")
    );
})

const getAllVideos = asyncHandler(async(req, res)=>{

     
    const {query} = req.query;
   
    const videos = await Video.aggregate([
        {
            $match:{
                $and:[
                    {
                       isPublished:true
                    },
                    {
                        $text:{
                            $search:query,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                score:{
                    $meta:"textScore"
                }
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1
                        }
                    }
                ]
            },
            
        },
       {
        $lookup:{
            from:"views",
            localField:"_id",
            foreignField:"video",
            as:"totalViews",
        }
       },
        {
            $addFields:{
                owner:{$first:"$owner"},
                totalViews:{ $size:"$totalViews"}
            }
        },
        {
            $sort:{
                score:-1,
                views:-1
            }
        }
    ]);

    if(!videos){
        throw new ApiError(500, "Something went wrong while fetching videos");
    }
    return res.status(200).json(
        new ApiResponse(200, videos, "Video fetched successfully")
    )
    
    
});

const getFeedVideos = asyncHandler(async(req, res)=>{
   
   const videos = await Video.aggregate([
    {
       $sort:{createdAt:-1},
    },
    {
        $sample:{
            size:50,
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {
                    $project:{
                        username:1,
                        fullname:1,
                        avatar:1,
                        coverImage:1,
                    }
                }
            ]

        },
        
    },
    {
        $lookup:{
            from:"views",
            localField:"_id",
            foreignField:"video",
            as:"totalViews",
        }
    },
    {
        $addFields:{
            owner:{
               $first:"$owner", 
            },
            totalViews:{
                $size:"$totalViews"
            }
        }
    }
   ]);

   return res.status(200).json(
    new ApiResponse(200, {videos}, "Video fetched successfully")
   )
   
});


export {uploadVideo, getVideoFromId, updateVideo, deleteVideo, togglePublishStatus, getAllVideos, getFeedVideos}