import mongoose from "mongoose";

const viewsSchema = new mongoose.Schema({

    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
          
    },

    viewer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
    
},{timestamps:true});

export const Views = mongoose.model("Views", viewsSchema);