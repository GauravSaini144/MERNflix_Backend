import mongoose from "mongoose"

const watchLaterSchema = new mongoose.Schema({

    video:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Video',
    },

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    }
}, {timestamps:true});

export const WatchLater = mongoose.model("WatchLater", watchLaterSchema);
