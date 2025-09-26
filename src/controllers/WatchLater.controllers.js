import { WatchLater } from "../models/watchLater.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const toggleWatchLater = asyncHandler(async(req, res)=>{

    const {videoId} = req.params;

    const isPresent = await WatchLater.findOne({
        video:videoId,
        user:req.user?._id,
    })

    if(isPresent){
        const removeFromWatchLater = await WatchLater.deleteOne({
            video:videoId,
            user:req.user._id,
        });

        return res.status(200).json(new ApiResponse(200, removeFromWatchLater, "Removed From Watch Later"));
    }
     
    const addWatchLater = await WatchLater.create({
        video:videoId,
        user:req.user._id,
    });

    if(!addWatchLater){
        throw new ApiError(405, "Error while adding in watch later");
    }

    return res.status(200).json( new ApiResponse(200, addWatchLater, "added to watch later"));


})


export const getWatchLaterVideos = asyncHandler(async(req, res)=>{

    
    const watchLaterVideos = await WatchLater.aggregate([
        {
            $match:{
                user: new mongoose.Types.ObjectId(req.user._id), 
            }
        },

        {
            $lookup:{

                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video",
                pipeline:[
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
                            avatar:1,
                            fullname:1
                        }
                    }
                            ]
                        }
                    },
                    {
                      $lookup:{
                        from:"views",
                         localField:"_id",
                         foreignField:"video",
                         as:"totalViews"
                      }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            },
                            totalViews:{
                                $size:"$totalViews",
                            }
                        }
                    },
                    
                ]
                
            },

           
        },

        {

             $addFields:{
               video:{
                 $first:"$video"
                }
            }
        },
        {
            $project:{
                video:1
            }
        },

     {
  $match: { video: { $exists: true, $ne: null } }  // prevents MISSING issue
},
{
  $replaceRoot: { newRoot: "$video" }
},

 {
            $sort: { createdAt: -1 } 
        }



    ]);

    return res.status(200).json(new ApiResponse(200, watchLaterVideos, "watch later videos fetched succesfully"));

})

