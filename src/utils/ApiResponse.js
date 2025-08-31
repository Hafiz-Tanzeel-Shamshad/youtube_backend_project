class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode;  // HTTP status (200, 201, etc.)
        this.data = data;              // The main payload (user, products, etc.)
        this.message = message;        // Optional message ("Success", "Created", etc.)
        this.success = statusCode < 400; // true if < 400 (200, 201, 204...), false if 400+
    }
}


export { ApiResponse };