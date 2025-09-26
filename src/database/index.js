import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB=async()=>{

    try {
         const connectionObject = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);    
         console.log(`CONNECTED TO MONGODB !!! CHECK HOST:::${connectionObject.connection.host}`);
         

    } catch (error) {
        console.log("ERROR CONNECTING MONGODB !!!!!", error);
        process.exit(1);
        
    }
}

export default connectDB;