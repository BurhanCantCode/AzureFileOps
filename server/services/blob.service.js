const { containerClient } = require('../config/azure-storage');
const { Readable } = require('stream');
const crypto = require('crypto');

class BlobService {
  async uploadFile(file, fileName, onProgress = () => {}, folderPath = '') {
    try {
      const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
      const blockBlobClient = containerClient.getBlockBlobClient(fullPath);
      
      // Get actual file size from buffer if size is undefined
      const fileSize = file.size || file.buffer.length;
      console.log(`Starting upload for ${fullPath} (${(fileSize / (1024 * 1024)).toFixed(2)}MB)`);

      // For files larger than 100MB, use parallel chunked upload
      if (fileSize > 100 * 1024 * 1024) {
        return await this.uploadLargeFile(file, blockBlobClient, fileSize, onProgress);
      }

      // For smaller files, use single upload with high concurrency
      console.log('Using single upload for small file');
      let lastProgress = 0;
      const response = await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        },
        metadata: {
          originalName: file.originalname,
          size: fileSize.toString()
        },
        concurrency: 20,
        onProgress: (progress) => {
          const percentage = Math.round((progress.loadedBytes / fileSize) * 100);
          if (percentage > lastProgress) {
            lastProgress = percentage;
            onProgress({ 
              loaded: progress.loadedBytes,
              total: fileSize,
              percentage
            });
          }
        }
      });

      // Send 100% progress only after successful upload
      onProgress({ loaded: fileSize, total: fileSize, percentage: 100 });
      console.log(`Successfully uploaded ${fullPath}`);
      return {
        url: blockBlobClient.url,
        etag: response.etag,
        lastModified: response.lastModified
      };
    } catch (error) {
      console.error(`Upload failed for ${fileName}:`, error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadLargeFile(file, blockBlobClient, fileSize, onProgress) {
    const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks
    const MAX_CONCURRENT_UPLOADS = 10;
    const chunks = [];
    let uploadedBytes = 0;
    let lastReportedProgress = 0;

    // Prepare chunks
    for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
      const chunk = file.buffer.slice(offset, Math.min(offset + CHUNK_SIZE, fileSize));
      const blockId = Buffer.from(`block-${chunks.length.toString().padStart(6, '0')}`)
        .toString('base64');
      
      chunks.push({
        blockId,
        data: chunk,
        size: chunk.length,
        offset
      });
    }

    console.log(`Starting parallel upload with ${chunks.length} chunks of ${CHUNK_SIZE / (1024 * 1024)}MB each`);

    try {
      // Upload chunks in parallel
      const uploadChunk = async (chunk) => {
        const chunkSizeMB = (chunk.size / (1024 * 1024)).toFixed(2);
        console.log(`Uploading chunk at offset ${chunk.offset / (1024 * 1024)}MB, size: ${chunkSizeMB}MB`);
        
        await blockBlobClient.stageBlock(chunk.blockId, chunk.data, chunk.size, {
          onProgress: (progress) => {
            const currentProgress = uploadedBytes + progress.loadedBytes;
            const percentage = Math.round((currentProgress / fileSize) * 100);
            
            if (percentage > lastReportedProgress) {
              lastReportedProgress = percentage;
              onProgress({
                loaded: currentProgress,
                total: fileSize,
                percentage: Math.min(percentage, 99) // Never report 100% until fully complete
              });
            }
          }
        });
        
        uploadedBytes += chunk.size;
        return chunk.blockId;
      };

      // Process chunks in parallel batches
      const blockIds = [];
      for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = chunks.slice(i, i + MAX_CONCURRENT_UPLOADS);
        const results = await Promise.all(batch.map(uploadChunk));
        blockIds.push(...results);
      }

      console.log('All chunks uploaded, committing blob...');
      const response = await blockBlobClient.commitBlockList(blockIds, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        },
        metadata: {
          originalName: file.originalname,
          size: fileSize.toString()
        }
      });

      // Only send 100% after successful commit
      onProgress({ loaded: fileSize, total: fileSize, percentage: 100 });
      console.log('Upload completed successfully');
      return {
        url: blockBlobClient.url,
        etag: response.etag,
        lastModified: response.lastModified
      };
    } catch (error) {
      console.error('Parallel upload failed:', error);
      await this.deleteFile(blockBlobClient.name).catch(() => {});
      throw new Error(`Failed to upload large file: ${error.message}`);
    }
  }

  async deleteFile(fileName) {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      const exists = await blockBlobClient.exists();
      
      // Check if this is a folder by listing its contents
      const folderContents = [];
      for await (const blob of containerClient.listBlobsFlat({ prefix: `${fileName}/` })) {
        folderContents.push(blob.name);
      }

      if (folderContents.length > 0) {
        // This is a folder, delete all contents first
        for (const blobName of folderContents) {
          const blobClient = containerClient.getBlockBlobClient(blobName);
          await blobClient.delete();
        }
        // Delete the folder marker if it exists
        const folderMarker = containerClient.getBlockBlobClient(`${fileName}/.folder`);
        await folderMarker.delete().catch(() => {});
        return;
      }
      
      if (!exists) {
        throw new Error('File not found');
      }
      
      await blockBlobClient.delete();
    } catch (error) {
      console.error('Delete operation failed:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async createFolder(folderPath) {
    try {
      // Azure Blob Storage doesn't have actual folders, so we create an empty blob with a special name
      const folderMarker = `${folderPath}/.folder`;
      const blockBlobClient = containerClient.getBlockBlobClient(folderMarker);
      await blockBlobClient.upload('', 0);
      return { success: true, path: folderPath };
    } catch (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  async listFiles(prefix = '') {
    try {
      console.log('Listing files with prefix:', prefix);
      
      // Normalize root path handling
      const normalizedPrefix = prefix === '/' || prefix === '' 
        ? '' 
        : prefix.split('/').filter(Boolean).join('/');
        
      const options = {
        prefix: normalizedPrefix ? `${normalizedPrefix}/` : '',
      };

      console.log('Using normalized options:', { 
        originalPrefix: prefix,
        normalizedPrefix,
        optionsPrefix: options.prefix 
      });

      // Validate container exists
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        throw new Error('Storage container not found');
      }

      // First pass: collect all blobs
      const allBlobs = new Set();
      for await (const blob of containerClient.listBlobsFlat(options)) {
        // Skip empty paths or paths that exactly match the prefix
        if (!blob.name || blob.name === normalizedPrefix) continue;
        allBlobs.add(blob.name);
      }

      // Second pass: process folder markers
      const folderMarkers = new Map();
      for (const blobName of allBlobs) {
        if (blobName.endsWith('/.folder')) {
          const folderPath = blobName.slice(0, -7); // remove /.folder
          const folderName = folderPath.split('/').pop() || folderPath;
          
          // Don't add empty folder names
          if (!folderName) continue;

          console.log('Found folder marker:', { folderPath, folderName });
          
          folderMarkers.set(folderPath, {
            entry: {
              name: folderName,
              originalName: folderName,
              type: 'folder',
              isDir: true,
              path: folderPath,
              lastModified: new Date(),
              size: 0,
              contentType: 'application/x-directory'
            }
          });
        }
      }

      // Third pass: process files and implicit folders
      for (const blobName of allBlobs) {
        if (blobName.endsWith('/.folder')) continue;
        
        const relativePath = options.prefix 
          ? blobName.slice(options.prefix.length) 
          : blobName;
        
        if (!relativePath) continue;

        const parts = relativePath.split('/');
        
        // Handle root level items
        if (parts.length === 1 || (parts.length === 2 && parts[1] === '')) {
          if (!files.has(blobName)) {
            files.set(blobName, {
              name: parts[0],
              originalName: parts[0],
              path: blobName,
              type: 'file',
              isDir: false
            });
          }
          continue;
        }

        // Handle nested items
        const folderName = parts[0];
        const fullFolderPath = options.prefix 
          ? `${options.prefix}/${folderName}`.replace(/\/+/g, '/')
          : folderName;

        if (folderName && !folderMarkers.has(fullFolderPath)) {
          folderMarkers.set(fullFolderPath, {
            entry: {
              name: folderName,
              originalName: folderName,
              type: 'folder',
              isDir: true,
              path: fullFolderPath,
              lastModified: new Date(),
              size: 0,
              contentType: 'application/x-directory'
            }
          });
        }
      }

      // Combine folders and files
      const result = [...folderMarkers.values()].map(f => f.entry)
        .concat([...files.values()]);

      return result;
    } catch (error) {
      console.error('Blob service list operation failed:', error);
      throw error; // Re-throw to be handled by controller
    }
  }

  async getBlobMetadata(blobName) {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const properties = await blockBlobClient.getProperties();
      return properties.metadata;
    } catch (error) {
      return {};
    }
  }
}

module.exports = new BlobService(); 