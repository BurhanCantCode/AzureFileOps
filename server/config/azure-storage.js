require('dotenv').config();
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

function parseConnectionString(connectionString) {
  if (!connectionString) {
    throw new Error('Azure Storage Connection String is not defined');
  }

  const config = {};
  connectionString.split(';').forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  });

  return config;
}

function createBlobServiceClient() {
  const config = parseConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  console.log('Storage Account:', config.AccountName);

  if (!config.AccountName || !config.AccountKey) {
    throw new Error('Invalid storage credentials. Both AccountName and AccountKey are required.');
  }

  // Create a SharedKeyCredential
  const sharedKeyCredential = new StorageSharedKeyCredential(
    config.AccountName,
    config.AccountKey
  );

  // Create the BlobServiceClient
  const blobServiceClient = new BlobServiceClient(
    `https://${config.AccountName}.blob.core.windows.net`,
    sharedKeyCredential
  );

  return blobServiceClient;
}

let blobServiceClient;
let containerClient;

(async () => {
  try {
    console.log('Initializing Azure Storage client with retry...');
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        blobServiceClient = createBlobServiceClient();
        break;
      } catch (error) {
        retryCount++;
        console.log(`Retry ${retryCount} of ${maxRetries}`);
        if (retryCount === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    if (!containerName) {
      throw new Error('Container name is not defined in environment variables');
    }
    
    console.log('Container name:', containerName);
    containerClient = blobServiceClient.getContainerClient(containerName);
  } catch (error) {
    console.error('Failed to initialize Azure Storage:', error);
    throw error;
  }
})();

async function initializeContainer() {
  try {
    console.log('Checking container existence...');
    const exists = await containerClient.exists();
    
    if (!exists) {
      console.log('Container does not exist, creating...');
      const createContainerResponse = await containerClient.create({
        access: 'blob' // Allow public access to blobs only
      });
      console.log('Container created successfully:', createContainerResponse.requestId);
    } else {
      console.log('Container already exists');
    }
  } catch (error) {
    console.error('Container initialization error:', error);
    throw error;
  }
}

// Initialize on startup
initializeContainer().catch(error => {
  console.error('Container initialization failed:', error);
  process.exit(1);
});

module.exports = {
  blobServiceClient,
  containerClient
}; 