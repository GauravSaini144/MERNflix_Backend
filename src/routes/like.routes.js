import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getLikedVideos, getLikesOfVideo, toggleLike } from "../controllers/like.controller.js";


const router = Router();

router.route("/like/:videoId").post(verifyJwt, toggleLike)
router.route("/liked-videos").get(verifyJwt, getLikedVideos);
router.route("/like/:videoId").get(verifyJwt, getLikesOfVideo);
export default router;