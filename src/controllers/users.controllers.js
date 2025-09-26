import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const registerUser = asyncHandler( async(req, res)=>{
   // steps to register user

   // get user details from frontend
    const {username, email, fullname, password} = req.body;

   // validation - not empty
   if(username.trim()===""){
      throw new ApiError(400, "username required");
   }
   if(email.trim()===""){
      throw new ApiError(400, "email required");
   }
   if(fullname.trim()===""){
      throw new ApiError(400, "fullname required");
   }
   if(password.trim()===""){
      throw new ApiError(400, "password required");
   }
   // check if user already exists: username, email
   const isEmailUsed = await User.findOne({email:email});
   if(isEmailUsed){
      throw new ApiError(400, "email already exist");
   }

   const isUserNameUsed = await User.findOne({username:username});
   if(isUserNameUsed){
      throw new ApiError(400, "username already exist");
   }

   
   // check for images, check for avatar
    
    const avatarLocalPath = req.files?.avatar[0]?.path;

    if(!avatarLocalPath){
      throw new ApiError(400, "Avatar image is required");
    }
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocalPath = req.files?.coverImage[0]?.path;
    }
   

   // upload them to cloudinary, avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage;
    if(coverImageLocalPath){
       coverImage = await uploadOnCloudinary(coverImageLocalPath); 
    }

   

    if(!avatar.url){
      throw new ApiError(400, "Avatar image is required");
    }
   // create user object - create entery in db

   const createdUser = await User.create({
      fullname,
      email,
      username:username.toLowerCase(),
      avatar:avatar.url,
      coverImage:coverImage?.url||"",
      password,
   });

   
   // check for user creation and // remove password and refresh token field from response
   
   const user= await User.findById(createdUser._id).select(
      "-password -refreshToken"
   );

   if(!user){
      throw new ApiError(500, "Something went wrong while creating register user");
   }


   // return res
   return res.status(200).json(

      new ApiResponse(200, user, "User created and registered successfuly")
   )

});


const generateAccessAndRefreshToken=async(userID)=>{
   try {
      const user = await User.findById(userID);
 const accessToken = user.generateAccessToken();
 const refreshToken = user.generateRefreshToken();

 user.refreshToken = refreshToken;
 await user.save({validateBeforeSave:false});

 return {refreshToken, accessToken};
   } catch (error) {
       
      throw new ApiError(500, "ERROR WHILE GENERATING ACCESS AND REFRESH TOKEN !!!!!!!!");
      
   }

}

const loginUser = asyncHandler( async(req, res)=>{
   // steps to create login

   //get data from frontend
   
   const {identifier,password} = req.body;
    
   
   //validation - not empty
   if(identifier?.trim()===""){
      throw new ApiError(400, "username or email required");
   }

   if(password.trim()===""){
      throw new ApiError(400, "Password required");
   }
   

   //check user exists------


const user = await User.findOne({
   $or:[{username:identifier}, {email:identifier}]
});

if(!user){
      throw new ApiError(404, "User nor found with this email or username");
   }


   

   //if exists compare password
   const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
      throw new ApiError(404, "Invalid user credentials");
    }

   // generate refresh and access token

   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
   const userLoggedIn = await User.findById(user._id).select("-password -refreshToken");

   // send cookie
   const options={
      httpOnly:true,
      secure:true,
      maxAge:10*24*60*60*1000
   }
    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
         user:userLoggedIn,
         refreshToken,
         accessToken
      },"user logged in successfuly")
    );
   
   
  
})

const logoutUser = asyncHandler(async(req,res)=>{
const user =   await User.findByIdAndUpdate(
      req.user._id, 
      {
         $set:{
            refreshToken:undefined
         }
      },
      {
         new:true
      }
   )
   
   const options={
      httpOnly:true,
      secure:true,
   }
   return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken", options)
   .json(
      new ApiResponse(200, "User Looged Out Successfuly")
   );
})


const refreshUserAccessToken = asyncHandler(async(req, res)=>{
   const token = req.cookies?.refreshToken || req.body?.refreshToken;

   if(!token){
      throw new ApiError(401, "Unauthorized request");

   }
    
   try {
      const decodedData = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
       
      if(!decodedData?._id){
          throw new ApiError(401, "Invalid refresh token");

      }

      const user = await User.findById(decodedData?._id);
      if(!user){
         throw new ApiError(401,"Invalid refresh token as not found any user");
      }

      if(token!==user?.refreshToken){
         throw new ApiError(401, "refreshToken is expired or used");
      }
      
      const options={
         httpOnly:true,
         secure:true,
      }
      const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
     
     return res.status(200).cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(
      new ApiResponse(200,
         {accessToken, refreshToken},
         "access token refreshed successfuly"
      )
     ) 

   } catch (error) {
      
      throw new ApiError(401, "Invalid Access Token Error");
   }
})

const getCurrentUser = asyncHandler(async(req, res)=>{

   if(!req.user){
     throw new ApiError(400, "Unauthorized request");
   }

   const user = await User.findById(req.user?._id).select("-password");

   if(!user){
      throw new ApiError(400, "Unauthorized request");

   }
   

   return res.status(200).json(
      new ApiResponse(200,{user}, "User find successfuly")
   )

   
})

const updateUserDetails = asyncHandler(async(req, res)=>{
   const {fullname, email} = req.body;
       
   if(!(fullname || email)){
      throw new ApiError(400,"fullname or email not found for updation");
   }
   if(fullname===undefined || fullname.trim()===""){
       throw new ApiError(400, "Cant update to null");
   }
   if(email===undefined || email.trim()===""){
       throw new ApiError(400, "Cant update to null");

   }
   if(!req.user){
      throw new ApiError(400,"unauthorized request as you not loogedIn");
   }

   
     const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            fullname,
            email,
         }
      },
      {
         new:true,
      }
     ).select("-password");
  
     if(!user){
      throw new ApiError(400, "User not found for updation");
     }

     return res.status(200).json(
      new ApiResponse(200, {
         user
      },"User details Updated successfuly")
     )
});

const updatePassword = asyncHandler(async (req, res)=>{
   const {oldPassword, newPassword} = req.body;
   if(!oldPassword.trim() || !newPassword.trim()){
      throw new ApiError(400, "old password or new password required");

   }

   const user = await User.findById(req.user?._id);
   if(!user){
      throw new ApiError(402, "unauthorized request to change password");
   
   }

   const isPasswordValid = await user.isPasswordCorrect(oldPassword);
   if(!isPasswordValid){
      throw new ApiError(400, "Incorrect Old Password");
   }

   user.password = newPassword;
   user.save({validateBeforeSave:false});
   
   return res.status(200).json(
      new ApiResponse(200,{},"Password Updated Successfuly")
   );

});


const updateAvatar = asyncHandler(async(req, res)=>{
   const newAvatarLocalPath = req.file?.path;
   if(!newAvatarLocalPath){
      throw new ApiError(400, "New Avatar Image Not Found, Please Upload");
   }

   // geting image url for deleting previous image from cloufinary
   const getUser =  await User.findById(req.user?._id);
   const url = getUser.avatar;
   
   // uploading new image
   const newAvatar = await uploadOnCloudinary(newAvatarLocalPath);

   if(!newAvatar.url){
      throw new ApiError(500, " new avatar upload error, urk not found");
   }
   // deleting previous image from cloufinary
   const response =await deleteOnCloudinary(getUser.avatar);
   if(response.result!=="ok"){
      throw new ApiError(500, response.result);
   }
   
   
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar:newAvatar?.url,
         },

      },
      {
         new:true,
      },
      {
         validateBeforeSave:false,
      }
   ).select("-password");

   return res.status(200).json(
      new ApiResponse(200,{user}, "Avatar Updated Successfuly")
   )
})

const updateCoverImage = asyncHandler(async(req, res)=>{
   const getUser = await User.findById(req.user?._id); 
   const newCoverImageLocalPath = req.file?.path;
   if(!newCoverImageLocalPath){
      throw new ApiError(400, "New Cover Image Not Found, Please Upload");

   }
   const newCoverImage = await uploadOnCloudinary(newCoverImageLocalPath);
   if(!newCoverImage){
      throw new ApiError(500, "Cover Image file not upload");
   }

   const response =await deleteOnCloudinary(getUser.coverImage);
   if(response.result!=="ok"){
      throw new ApiError(500, response.result);
   }
   const user = await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            coverImage:newCoverImage?.url
         }
      },
      {
         new:true,
      },
      {
         validateBeforeSave:false,
      }
   ).select("-password");

   if(!user){
      throw new ApiError(402, "User not found and error in cover image update");
   }

   return res.status(200).json(
      new ApiResponse(200, {user}, "Cover Image updated successfuly")
   );
});


const getUserChannelProfile = asyncHandler(async(req, res)=>{
   const {username} = req.params;

   if(!username?.trim()){
      throw new ApiError(400, "username is missing");
   }

   const channel = await User.aggregate([
      {
         $match:{
            username : username?.toLowerCase()
         }
      },
      {
         $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"    
         }
      },
      {
         $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
         }
      },
      {
        $lookup:{
         from:"videos",
         localField:"_id",
         foreignField:"owner",
         as:"videos",
         pipeline:[
            {
               $lookup:{
                   from:"views",
                   localField:'_id',
                   foreignField:'video',
                   as:'totalViews',
               }
            },
            {
               $addFields:{
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
            subscribersCount:{
               $size:"$subscribers"
            },
            subscribedToCount:{
               $size:"$subscribedTo"
            },
            isSubscribed:{
               $cond:{
                  if:{$in :[new mongoose.Types.ObjectId(req.user?._id), "$subscribers.subscriber"]},
                  then:true,
                  else:false
               }
            },
            videos:"$videos"

         }
      },
      {
         $project:{
            fullname:1,
            username:1,
            email:1,
            avatar:1,
            coverImage:1,
            subscribersCount:1,
            subscribedToCount:1,
            isSubscribed:1,
            videos:1

         }
      }
   ]);

   if(!channel?.length){
      throw new ApiError(404, "channel does not exist or found");
   }

   

   return res.status(200).json(
      new ApiResponse(200, channel[0], "Channel fetched successfuly ")
   );

});

const getWatchHistory = asyncHandler(async(req, res)=>{
   
   const user = await User.aggregate([
      {
         $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField:"_id",
            as: "watchHistory",
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
                              fullname: 1,
                              username: 1,
                              avatar: 1
                           }
                        }
                     ]
                  }
               },
               {
                  $addFields: {
                     owner:{
                        $first: "$owner"
                     }
                  }
               }
            ]
         }
      }
   ])
   
   return res.status(200).json(
      new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully" )
   )
   
})

export {registerUser, loginUser, logoutUser, refreshUserAccessToken, getCurrentUser, updateUserDetails, updatePassword, updateAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory};