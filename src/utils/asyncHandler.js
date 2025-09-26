
//  we have two ways to write async handlre function 1 is using Promise and 2 is using try catch block 


const asyncHandler=(fn)=>{
   return (req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch((error)=>next(error));
    }
}

export {asyncHandler};


// using try catch block 
//  const AsyncHandler=(fn)=>async(req,res,next)=>{
//         try {
//             await fn(req,res,next);
//         } catch (error) {

//             res.status(req.statusCode||500).json({
//                 success:false,
//                 message:error.message,
//             })
            
//         }
//  }


