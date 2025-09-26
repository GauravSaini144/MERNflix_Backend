import mongoose from "mongoose"

const historySchema = new mongoose.Schema({

    viewer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }

}, {timestamps:true});

export const History = mongoose.model("History", historySchema);