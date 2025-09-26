import dotenv from "dotenv"
import connectDB from "./database/index.js";
import { app } from "./app.js";

dotenv.config();
connectDB().then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log("Listening on PORT:", process.env.PORT);
    })
}).catch((error)=>{
    console.log("ERROR!!!!!! WHILE CONNECTION MONGODB, ",error);
});
