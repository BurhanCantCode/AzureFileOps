require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const errorMiddleware = require('./middleware/error.middleware');
const uploadRoutes = require('./routes/upload.routes');
const compression = require('compression');
const { BlobServiceClient } = require('@azure/storage-blob');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(compression());

// Add connection pooling
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING,
  {
    retryOptions: {
      maxTries: 5,
      tryTimeoutInMs: 30000,
      retryDelayInMs: 5000
    }
  }
);

// Add timeout middleware before routes
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(504).json({ message: 'Request timeout' });
  });
  next();
});

// API Routes
app.use('/api/upload', uploadRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling
app.use(errorMiddleware);

// Add before app.listen()
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    version: process.env.npm_package_version,
    node: process.version
  });
});

app.get('/node-version', (req, res) => {
  res.status(200).json({
    nodeVersion: process.version,
    npmVersion: process.env.npm_version,
    engine: process.versions
  });
});

console.log('Starting server with environment:', process.env.NODE_ENV);
console.log('Storage container:', process.env.AZURE_STORAGE_CONTAINER_NAME);
console.log('Server listening on port:', process.env.PORT);

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  console.error('AZURE_STORAGE_CONNECTION_STRING is required');
  process.exit(1);
}

if (!process.env.AZURE_STORAGE_CONTAINER_NAME) {
  console.error('AZURE_STORAGE_CONTAINER_NAME is required');
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Add this after server starts
server.on('listening', () => {
  const addr = server.address();
  console.log(`Server listening on ${addr.address}:${addr.port}`);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}); 