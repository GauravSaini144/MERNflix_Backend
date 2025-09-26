import {Router} from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createWatchHistory, getWatchHistory } from "../controllers/history.controllers.js";

const router = Router();

router.route("/:videoId").post(verifyJwt, createWatchHistory);
router.route("/videos").get(verifyJwt, getWatchHistory);


export default router;