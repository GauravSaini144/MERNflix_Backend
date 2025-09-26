import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser"
const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,

}));

app.use(express.json({limit:"16kb"}))

app.use(express.urlencoded({extended:true,limit:"16kb"}));

app.use(express.static('public'));
app.use(cookieParser());


// importing routes
import userRoute from "./routes/users.routes.js"
import videoRoute from "./routes/video.routes.js"
import subscriptionRoute from "./routes/subscription.routes.js"
import likeRoute from "./routes/like.routes.js"
import commentRoute from "./routes/comment.routes.js"
import { ApiError } from "./utils/ApiError.js";
import viewsRoute from "./routes/views.routes.js"
import watchLaterRoute from "./routes/watchlater.routes.js"
import historyRoute from "./routes/history.routes.js"
// route describing

app.use("/api/v1/users", userRoute);
app.use("/api/v1/videos",videoRoute);
app.use("/api/v1/subscription", subscriptionRoute);
app.use("/api/v1/like", likeRoute);
app.use("/api/v1/comment", commentRoute);
app.use("/api/v1/views", viewsRoute);
app.use("/api/v1/watch-later", watchLaterRoute);
app.use("/api/v1/history", historyRoute);



app.use((err, req, res, next) => {
  console.error(err); // logs error details in backend console

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
  }})


export {app}