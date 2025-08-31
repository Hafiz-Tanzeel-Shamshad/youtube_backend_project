class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)   // Call parent class (Error) with message
        // Extra properties for API errors
        this.statusCode = statusCode;  // HTTP status (e.g., 400, 401, 500)
        this.data = null               // Can store extra data if needed
        this.message = message         // Error message
        this.success = false           // Always false (because it’s an error)
        this.errors = errors           // Validation or multiple error details

        // Stack trace (helps with debugging)
        if(stack){
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError};
