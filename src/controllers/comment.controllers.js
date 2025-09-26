import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";


const createComment = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;
    const {comment} = req.body;

    if(!videoId){
        throw new ApiError(400, "video id required for comment");
    }

    if(!(comment && comment.trim()!=="")){
       throw new ApiError(400, "Comment required ");
    }

    const newComment  = await Comment.create({
        comment:comment,
        video:videoId,
        owner:req.user._id
    });

    if(!newComment){
        throw new ApiError(500, "ERROR WHILE COMMENTING");
    }

    return res.status(200).json(
        new ApiResponse(200, newComment, "commented successfully")
    )
})


const deleteComment = asyncHandler(async(req, res)=>{
    
     const {videoId, commentId} = req.params;

     if(!videoId){
        throw new ApiError(400, "video id required to delete comment");
    }
       
    
     if(!commentId){
        throw new ApiError(400, "comment id required to delete comment");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId); 
     
    if(!deleteComment){
        throw new ApiError(500, "Error while finding and deleting comment");
    }

    return res.status(200).json( new ApiResponse(200, deletedComment, "comment deleted successfully"))
})



const updateComment = asyncHandler(async(req, res)=>{
    
    const {videoId, commentId} = req.params;
    const {updatedComment} = req.body;
    if(!videoId){
        throw new ApiError(400, "video id required to update comment");
    }
     if(!commentId){
        throw new ApiError(400, "comment id required to update comment");
    }

    if(!(updatedComment && updatedComment.trim()!=="")){
        throw new ApiError(400, "Comment required for updating comment");
    }

    const comment = await Comment.findByIdAndUpdate(commentId,{
        comment:updatedComment
    },
    {
        new:true
    },
{
    validateBeforeSave:false,
});

if(!comment){
    throw new ApiError(500, "Something went wrong while updating comment, did you send correct id?");
}

return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"))

})



const getAllComment = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400, "video id required for fetching comments");
    
    }

    const allComments  = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId),
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
                            avatar:1,
                        },
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner",
                }
            }
        },

        {
            $sort:{createdAt:-1},
        }

    ]);
    
    

    res.status(200).json(new ApiResponse(200, allComments, "all comments of video fetched successfully"))

})

export {createComment, deleteComment, updateComment, getAllComment};