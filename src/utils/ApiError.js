// we use this to standarized the way of sending errors

class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){

        super(message)

        this.statusCode=statusCode
        this.message=message
        this.errors=errors
        this.data=null; // generally we send null in this because if we not send any data and someone access this data then their will be undefined error and also we indicate that their is no data with error.
        this.success=false;
        if(stack){
            this.stack=stack

        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }

    }
}

export {ApiError};