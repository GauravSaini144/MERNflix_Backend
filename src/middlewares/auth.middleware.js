import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJwt = asyncHandler(async(req, res, next)=>{
    
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!token){
            throw new ApiError(401, "Unauthrized request, access tonken missing");
        }

        let decodedData;
try {
     decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET );
    
} catch (error) {
     if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    throw new ApiError(401, "Invalid access token");
  }

        const user = await User.findById(decodedData?._id).select("-password -refreshToken");

        if(!user){
            throw new ApiError(401, "user not found or Invalid Token");
        }

        req.user = user;
        return next();

    
})