import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getAllSubscribedChannel, getSubscriberCount, toggleSubscription } from "../controllers/subscription.controllers.js";

const router = Router();

router.route("/subscribe/:channelId").post(verifyJwt, toggleSubscription);
router.route("/subscribed").get(verifyJwt, getAllSubscribedChannel);
router.route("/subscribers/:channelId").get(verifyJwt, getSubscriberCount)
export default router;