import {Router} from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getWatchLaterVideos, toggleWatchLater } from "../controllers/WatchLater.controllers.js";

const router = Router();

router.route("/toggle-watch-later-video/:videoId").post(verifyJwt, toggleWatchLater);
router.route("/get-watch-later-video").get(verifyJwt, getWatchLaterVideos);

export default router
