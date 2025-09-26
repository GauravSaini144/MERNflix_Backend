import { Router } from "express";
import { deleteVideo, getAllVideos, getFeedVideos, getVideoFromId, togglePublishStatus, updateVideo, uploadVideo } from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router  = Router();

router.route("/upload-video").post(verifyJwt, upload.fields([
      
    {
        name:"video",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]), uploadVideo);

router.route("/video/:videoId").get(verifyJwt, getVideoFromId);
router.route("/update-video/:videoId").patch(verifyJwt, upload.single("thumbnail"), updateVideo);
router.route("/delete-video/:videoId").delete(verifyJwt, deleteVideo);
router.route("/toggle-publish-status/:videoId").patch(verifyJwt, togglePublishStatus);
router.route("/videos").get(verifyJwt, getAllVideos);
router.route("/all").get(verifyJwt, getFeedVideos);
export default router;