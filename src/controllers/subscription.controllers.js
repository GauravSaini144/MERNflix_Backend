import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    // Check if already subscribed → unsubscribe
    const existingSubscription = await Subscription.findOneAndDelete({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (existingSubscription) {
        return res
            .status(200)
            .json(new ApiResponse(200, {existingSubscription, flag:0}, "Unsubscribed successfully"));
    }

    // Otherwise, subscribe
    const newSubscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (!newSubscription) {
        throw new ApiError(500, "Error while subscribing to channel");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {newSubscription, flag:1}, "Subscribed successfully"));
});


const getAllSubscribedChannel = asyncHandler(async (req, res) => {
  const channelList = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "users", // get channel user info
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$channel" }, 
    {
      $lookup: {
        from: "subscriptions", // ✅ correct collection name
        localField: "channel._id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
      },
    },
    {
      $project: {
        _id: 0,
        channel: 1,
        subscriberCount: 1,
      },
    },
  ]);

  if (!channelList) {
    throw new ApiError(500, "Error while fetching subscribed channels");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channelList, "channels fetched successfully"));
});


const getSubscriberCount = asyncHandler(async(req, res)=>{
    const {channelId} = req.params;
    if(!channelId){
        throw new ApiError(400, "channel id required");

    }

    const subsCount = await Subscription.find({
        channel:channelId,
    });

    if(!subsCount){
        throw new ApiError(400, "something went wring, may be wrong channel id");
    }

    return res.status(200).json(new ApiResponse(200,{subsscribers:subsCount.length}, "subscribers count fetched successfully "))
})
export {toggleSubscription, getAllSubscribedChannel, getSubscriberCount};
