const ErrorHandler = require("../utils/errorhander");

module.exports = (err, req, res, next) => {
  console.error("=== ERROR MIDDLEWARE TRIGGERED ===");
  console.error("Error Name:", err.name);
  console.error("Error Message:", err.message);
  console.error("Error Status Code:", err.statusCode);
  console.error("Error Stack:", err.stack);
  console.error("Request URL:", req.originalUrl);
  console.error("Request Method:", req.method);
  console.error("Request Body:", JSON.stringify(req.body, null, 2));
  console.error("Full Error Object:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong Mongodb Id error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue)[0];
    const duplicateValue = err.keyValue[duplicateField];
    
    let message = "";
    if (duplicateField === "email") {
      message = `Email ${duplicateValue} is already registered. Please use a different email.`;
    } else if (duplicateField === "mobileNumber" || duplicateField === "phone") {
      // Handle both "mobileNumber" and legacy "phone" field
      message = `Mobile number ${duplicateValue} is already registered. Please use a different mobile number.`;
    } else {
      message = `${duplicateField} already exists. Please use a different ${duplicateField}.`;
    }
    
    err = new ErrorHandler(message, 409);
  }

  // Wrong JWT error
  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid, Try again `;
    err = new ErrorHandler(message, 400);
  }

  // JWT EXPIRE error
  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token is Expired, Try again `;
    err = new ErrorHandler(message, 400);
  }

  // Check for "next is not a function" error
  if (err.message && err.message.includes("next is not a function")) {
    console.error("SPECIFIC ERROR: next is not a function detected!");
    console.error("This usually means middleware chain is broken");
  }

  console.error("Sending error response:", {
    statusCode: err.statusCode,
    message: err.message,
  });

  // Format error response with errors array
  const errorResponse = {
    success: false,
    message: err.message,
  };

  // Add errors array if validation errors exist
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.errors = err.errors;
  } else if (err.message) {
    // If single error message, wrap it in errors array
    errorResponse.errors = [{ message: err.message }];
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
    errorResponse.errorName = err.name;
  }

  res.status(err.statusCode).json(errorResponse);
};
