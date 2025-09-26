import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";

import mongoose from "mongoose";
const toggleLike = asyncHandler(async(req, res)=>{

       
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400, "video id required");
    }
      
    // delete like if exist
    const userLiked  = await Like.findOneAndDelete(
        {
            likedBy : req.user._id,
            video:videoId
        }
    )

    if(userLiked){
        return res.status(200).json( new ApiResponse(200, userLiked, "Video Unliked"));
    }

    const createLike = await Like.create({
        video:videoId,
        likedBy:req.user._id,

    });

    if(!createLike){
        throw new ApiError(500, "Error while like video");
    }

    return res.status(200).json( new ApiResponse(200, createLike, "Video Liked"));
      
});

const getLikesOfVideo = asyncHandler(async(req,res)=>{
       
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(404, "video id required");

    }


    const totalLikes = await Like.countDocuments({video:videoId});
    
     const isLiked  = await Like.exists(
        {
            video:videoId,
            likedBy:req?.user?._id,

        }
     )
let isLikedByMe = Boolean(isLiked);
     return res.status(200).json(new ApiResponse(200, {totalLikes, isLikedByMe }, "likes fetched successfully"));
    
    
})

const getLikedVideos = asyncHandler(async (req, res)=>{

    const likedVideos = await Like.aggregate([

        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },

        {
            $lookup:{
                from :"videos",
                localField:"video",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    {
                        $lookup:{
                            from:'users',
                            localField:'owner',
                            foreignField:'_id',
                            as:'owner',
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        avatar:1,
                                        
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
        as:"totalViews"
       }
        },
      
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"},
                                totalViews:{
                    $size:"$totalViews"
                }
                        }
                    }

                ]
               
            }
        },
        
        {
            $addFields:{
                videos:{
                    $first:"$videos"
                },
                
                
            }
        },
        
        {
            $project:{
                videos:1,
                
            }
        },
{
  $match: { videos: { $exists: true, $ne: null } }  // prevents MISSING issue
},
{
  $replaceRoot: { newRoot: "$videos" }
}
    ]);

    if(!likedVideos){
        throw new ApiError(500, "ERROR WHILE FERCHING LIKED VIDEOS");
    }

    return res.status(200).json( new ApiResponse(200, likedVideos, "liked videos fetched successfully"))
})

export {toggleLike, getLikedVideos, getLikesOfVideo};
