import { Router } from "express";
import { createView, getVideoViewsCount } from "../controllers/views.controllers.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();


router.route("/views/:videoId").post(verifyJwt, createView);
router.route("/views/:videoId").get(verifyJwt, getVideoViewsCount);

export default router;