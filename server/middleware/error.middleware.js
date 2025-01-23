const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle Azure Storage specific errors
  if (err.name === 'RestError') {
    return res.status(500).json({
      error: 'Azure Storage Error',
      message: err.message,
      details: err.details
    });
  }

  // Handle file upload errors
  if (err.code === 'UNSUPPORTED_FILE_TYPE') {
    return res.status(400).json({
      error: 'Invalid File',
      message: err.message,
      code: err.code
    });
  }

  if (err.code === 'INVALID_FILE_NAME') {
    return res.status(400).json({
      error: 'Invalid File',
      message: err.message,
      code: err.code
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Invalid File',
      message: `File size exceeds limit of ${process.env.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      code: err.code
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware; 