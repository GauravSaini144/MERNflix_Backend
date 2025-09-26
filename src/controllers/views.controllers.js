import { Views } from "../models/views.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createView = asyncHandler(async(req, res)=>{

    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(404, "Video id required");

    }

    const view  = await Views.findOne({
                    
        video:videoId,
        viewer:req.user?._id,
    });

       if(view){
        return res.status(200).json( new ApiResponse(200, view, "View already exist for this video"));
       }

       const newView = await Views.create({
        video:videoId,
        viewer:req.user?._id,
       });
       
       if(!newView){
        throw new ApiError(500, "Error while creating view");
       }

       return res.status(200).json( new ApiResponse(200, newView,"View created successFully"));

});

export const getVideoViewsCount = asyncHandler(async(req, res)=>{

    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(404, "video id required");
    }

    const viewsCount = await Views.countDocuments({
        video:videoId,
    });

    return res.status(200).json(200, viewsCount, "Views count fetched");


})

