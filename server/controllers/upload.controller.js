const { BlobServiceClient } = require('@azure/storage-blob');
const { getContentType } = require('../utils/fileTypes');
const NodeCache = require('node-cache');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

console.log('Initializing Azure Blob Storage with container:', containerName);

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

// Check container exists and is accessible
(async () => {
  try {
    const exists = await containerClient.exists();
    if (!exists) {
      console.error('Container does not exist:', containerName);
      return;
    }
    console.log('Successfully connected to container:', containerName);
    
    // List all blobs in container
    console.log('Listing all blobs in container:');
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log('- Blob:', blob.name);
    }
  } catch (error) {
    console.error('Failed to connect to container:', error);
  }
})();

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Sanitize the path and filename
    const fileName = req.file.originalname.trim();
    const currentPath = (req.body.path || '').trim().replace(/^\/+|\/+$/g, '');
    
    // Construct the full blob path
    const blobName = currentPath ? `${currentPath}/${fileName}` : fileName;
    
    console.log('Uploading file:', {
      originalName: req.file.originalname,
      blobName: blobName,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: {
        blobContentType: req.file.mimetype
      }
    });

    const blobProperties = await blockBlobClient.getProperties();
    
    res.status(200).json({
      message: 'File uploaded successfully',
      data: [{
        name: fileName,
        path: blobName,
        size: req.file.size,
        type: req.file.mimetype,
        lastModified: blobProperties.lastModified,
        isDirectory: false
      }]
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

// Helper functions at top of file
async function isDirectory(path) {
  // Check for explicit folder marker first
  const markerClient = containerClient.getBlockBlobClient(`${path}/.folder_marker`);
  try {
    await markerClient.getProperties();
    return true;
  } catch {
    // Fallback to checking for children
    const iterator = containerClient.listBlobsFlat({ prefix: `${path}/` });
    for await (const _ of iterator) {
      return true;
    }
    return false;
  }
}

const listFiles = async (req, res) => {
  try {
    const path = req.query.path || '';
    console.log('Listing files for path:', path);

    const items = await blobService.listFiles(path);
    
    // Always wrap response in data property
    const response = { data: items };
    console.log('Sending response:', response);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ 
      message: 'Failed to list files',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const blobName = req.params.fileName;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Check if it's a directory by listing blobs with this prefix
    let isDirectory = false;
    const dirIterator = containerClient.listBlobsFlat({
      prefix: `${blobName}/`
    });
    
    for await (const _ of dirIterator) {
      isDirectory = true;
      break;
    }
    
    if (isDirectory) {
      // Delete all blobs in the directory
      for await (const blob of containerClient.listBlobsFlat({
        prefix: `${blobName}/`
      })) {
        await containerClient.getBlockBlobClient(blob.name).delete();
      }
    } else {
      await blockBlobClient.delete();
    }
    
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete item' });
  }
};

const createFolder = async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) return res.status(400).json({ message: 'Path is required' });

    const folderPath = path.replace(/\/+$/g, '');
    const markerPath = `${folderPath}/.folder_marker`;
    
    const blockBlobClient = containerClient.getBlockBlobClient(markerPath);
    await blockBlobClient.upload('', 0, {
      blobHTTPHeaders: { blobContentType: 'application/x-directory' }
    });

    res.status(200).json({
      message: 'Folder created successfully',
      data: [{
        name: folderPath.split('/').pop(),
        path: folderPath,
        isDirectory: true,
        type: 'folder'
      }]
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ message: 'Failed to create folder' });
  }
};

const renameItem = async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
      return res.status(400).json({ message: 'Both old and new paths are required' });
    }
    
    // Check if it's a directory
    const items = await listFiles({ query: { path: oldPath } }, { json: () => {} });
    const isDirectory = items.length > 0;
    
    if (isDirectory) {
      // Copy all files in the directory
      for await (const blob of containerClient.listBlobsFlat({
        prefix: `${oldPath}/`
      })) {
        const newBlobName = blob.name.replace(oldPath, newPath);
        const sourceClient = containerClient.getBlockBlobClient(blob.name);
        const targetClient = containerClient.getBlockBlobClient(newBlobName);
        
        await targetClient.beginCopyFromURL(sourceClient.url);
        await sourceClient.delete();
      }
    } else {
      const sourceClient = containerClient.getBlockBlobClient(oldPath);
      const targetClient = containerClient.getBlockBlobClient(newPath);
      
      await targetClient.beginCopyFromURL(sourceClient.url);
      await sourceClient.delete();
    }
    
    res.status(200).json({ message: 'Item renamed successfully' });
  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({ message: 'Failed to rename item' });
  }
};

const copyItem = async (req, res) => {
  try {
    const { sourcePath, destinationPath } = req.body;
    if (!sourcePath || !destinationPath) {
      return res.status(400).json({ message: 'Both source and destination paths are required' });
    }
    
    // Check if it's a directory
    const items = await listFiles({ query: { path: sourcePath } }, { json: () => {} });
    const isDirectory = items.length > 0;
    
    if (isDirectory) {
      // Copy all files in the directory
      for await (const blob of containerClient.listBlobsFlat({
        prefix: `${sourcePath}/`
      })) {
        const newBlobName = blob.name.replace(sourcePath, destinationPath);
        const sourceClient = containerClient.getBlockBlobClient(blob.name);
        const targetClient = containerClient.getBlockBlobClient(newBlobName);
        
        await targetClient.beginCopyFromURL(sourceClient.url);
      }
    } else {
      const sourceClient = containerClient.getBlockBlobClient(sourcePath);
      const targetClient = containerClient.getBlockBlobClient(destinationPath);
      
      await targetClient.beginCopyFromURL(sourceClient.url);
    }
    
    res.status(200).json({ message: 'Item copied successfully' });
  } catch (error) {
    console.error('Copy error:', error);
    res.status(500).json({ message: 'Failed to copy item' });
  }
};

const handleError = (res, error, context) => {
  console.error(`Error in ${context}:`, error);
  
  if (error.code === 'BlobNotFound') {
    return res.status(404).json({ message: 'File or folder not found' });
  }
  if (error.code === 'AuthorizationPermissionMismatch') {
    return res.status(403).json({ message: 'Permission denied' });
  }
  
  res.status(500).json({ 
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

const downloadFile = async (req, res) => {
  try {
    const blobName = req.params.fileName;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Get blob properties
    const properties = await blockBlobClient.getProperties();
    
    // Set response headers
    res.setHeader('Content-Type', properties.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${blobName.split('/').pop()}"`);
    res.setHeader('Content-Length', properties.contentLength);
    
    // Download and pipe the blob to the response
    const downloadResponse = await blockBlobClient.download();
    downloadResponse.readableStreamBody.pipe(res);
  } catch (error) {
    handleError(res, error, 'downloadFile');
  }
};

const batchDelete = async (req, res) => {
  try {
    const { paths } = req.body;
    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ message: 'Paths array is required' });
    }

    const deletePromises = paths.map(async path => {
      const isDir = await isDirectory(path);
      if (isDir) {
        // Delete directory contents
        for await (const blob of containerClient.listBlobsFlat({ prefix: `${path}/` })) {
          await containerClient.getBlockBlobClient(blob.name).delete();
        }
      }
      return containerClient.getBlockBlobClient(path).delete();
    });

    await Promise.all(deletePromises);
    res.status(200).json({ message: 'Items deleted successfully' });
  } catch (error) {
    console.error('Batch delete error:', error);
    res.status(500).json({ message: 'Failed to delete items' });
  }
};

module.exports = {
  uploadFile,
  listFiles,
  deleteFile,
  createFolder,
  renameItem,
  copyItem,
  downloadFile,
  batchDelete,
}; 