import { Router } from "express";
import { getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshUserAccessToken, registerUser, updateAvatar, updateCoverImage, updatePassword, updateUserDetails } from "../controllers/users.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router =Router();

router.route("/register").post(
    upload.fields([
    {
        name:"avatar",
        maxCount:1,
    },
    {
        name:"coverImage",
        maxCount:1,
    }
    ]),
    registerUser);

 router.route("/login").post(loginUser);

 router.route("/logout").post(verifyJwt, logoutUser);
 router.route("/refresh-user").post(refreshUserAccessToken);
 router.route("/get-user").get(verifyJwt, getCurrentUser);
 router.route("/update-user").patch(verifyJwt, updateUserDetails);
 router.route("/update-password").patch(verifyJwt, updatePassword);
 router.route("/update-avatar").patch( verifyJwt, upload.single("avatar"), updateAvatar);
 router.route("/update-coverimage").patch( verifyJwt, upload.single("coverImage"), updateCoverImage);
 router.route("/c/:username").get(verifyJwt, getUserChannelProfile);
 router.route("/history").get(verifyJwt, getWatchHistory);

export default router;
