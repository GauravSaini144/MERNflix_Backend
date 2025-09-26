import { History } from "../models/history.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";


export const createWatchHistory = asyncHandler(async(req, res)=>{
         
    
    const {videoId} = req.params;
        
    if(!videoId){
        throw new ApiError(404, "video id not found or required");
    }
    const watchHistory = await History.findOneAndUpdate(
        {
            viewer:req.user._id,
            video:videoId,
        },
        {},
        {new:true, upsert:true}
    );


    if(!watchHistory){
        throw new ApiError(500, "error while creating or updating watch history");
    }
         
    return res.status(200).json( new ApiResponse(200, watchHistory, "added to watch history successfully"));

         
});


export const getWatchHistory = asyncHandler(async(req, res)=>{


    const watchHistory = await History.aggregate([
        {
            $match:{
                viewer: new mongoose.Types.ObjectId(req.user._id),
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
                                        avatar:1,
                                        username:1,
                                        
                                    }
                                }
                            ]
                        },
                        
                    },{

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
                                $size:"$totalViews",
                            }
                        }
                    }
                ]
            }
                          
        },
        {
 $addFields:{
    video:{$first:"$video"}
 }
},{
 $project:{
    video:1,
    createdAt:1,
    updatedAt:1,
 }
},
{
  $match: { video: { $exists: true, $ne: null } }  
},
{
    $sort:{
        updatedAt: -1,
    }
}
        
    ]);

    

    return res.status(200).json(new ApiResponse(200, watchHistory, "Watch history fetched succesfully"));
    

});