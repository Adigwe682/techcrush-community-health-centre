// ======================================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// ======================================================
// Catches all errors that occur in the application and
// returns a consistent error response format.

const { errorCodes } = require("../utils/errorCodes");

/***
 * Wrap async controller functions to catch sync/async errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((error) => {
      next(error);
    });
  };
};

/***
 * Development error handler - returns full error details
 */
const handleError = (err, req, res, next) => {
  // Set status code (default to 500)
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let response;

  if (process.env.NODE_ENV === "development") {
    response = {
      status: err.status,
      statusCode: err.statusCode,
      message: err.message,
      error: err,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
    };
  } else {
    // Production: return minimal error details
    response = {
      status: err.status,
      statusCode: err.statusCode,
      message: err.message || "Internal server error",
    };
  }

  res.status(err.statusCode).json(response);
};

/***
 * 404 handler - for routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.status = "fail";
  error.isOperational = true;

  next(error);
};

module.exports = {
  handleError,
  notFoundHandler,
  catchAsync,
};
