import { Router } from "express";
import { createComment, deleteComment, getAllComment, updateComment } from "../controllers/comment.controllers.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/c/:videoId").post(verifyJwt, createComment)
router.route("/c/:videoId/comment/:commentId").delete(verifyJwt, deleteComment);
router.route("/c/:videoId/comment/:commentId").patch(verifyJwt,updateComment);
router.route("/c/:videoId").get(verifyJwt, getAllComment);

export default router;