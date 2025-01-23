const asyncHandler = require('express-async-handler');
const blobService = require('../services/blob.service');

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Sanitize file name
  const timestamp = Date.now();
  const sanitizedName = req.file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  const fileName = `${timestamp}-${sanitizedName}`;

  try {
    // Progress callback
    const sendProgress = (progress) => {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    };

    const result = await blobService.uploadFile(req.file, fileName, sendProgress);

    // Send final success response
    res.write(`data: ${JSON.stringify({ 
      type: 'complete',
      data: {
        fileName,
        originalName: req.file.originalname,
        url: result.url,
        contentType: req.file.mimetype,
        size: req.file.size,
        etag: result.etag,
        lastModified: result.lastModified
      }
    })}\n\n`);
    
    res.end();
  } catch (error) {
    // Send error event
    res.write(`data: ${JSON.stringify({ 
      type: 'error',
      error: error.message 
    })}\n\n`);
    res.end();
  }
});

const listFiles = asyncHandler(async (req, res) => {
  const { prefix, limit } = req.query;
  const maxResults = parseInt(limit) || 100;

  if (maxResults < 1 || maxResults > 1000) {
    res.status(400);
    throw new Error('Invalid limit parameter. Must be between 1 and 1000');
  }

  const files = await blobService.listFiles(prefix, maxResults);
  res.status(200).json({
    success: true,
    data: files
  });
});

const deleteFile = asyncHandler(async (req, res) => {
  const { fileName } = req.params;

  if (!fileName) {
    res.status(400);
    throw new Error('File name is required');
  }

  await blobService.deleteFile(fileName);
  
  res.status(200).json({
    success: true,
    message: 'File deleted successfully'
  });
});

module.exports = {
  uploadFile,
  listFiles,
  deleteFile
}; 