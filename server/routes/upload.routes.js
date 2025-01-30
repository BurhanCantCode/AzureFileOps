const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { 
  uploadFile, 
  listFiles, 
  deleteFile, 
  createFolder,
  renameItem,
  copyItem,
  downloadFile,
} = require('../controllers/upload.controller');
const blobService = require('../services/blob.service');

router.post('/', upload.single('file'), uploadFile);
router.get('/', async (req, res) => {
  try {
    const path = req.query.path || '';
    console.log('List request for path:', path);
    
    // Normalize path
    const normalizedPath = path.trim().replace(/^\/+|\/+$/g, '');
    console.log('Normalized path:', normalizedPath);
    
    const files = await blobService.listFiles(normalizedPath);
    res.json({ data: files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to list files'
    });
  }
});
router.delete('/:fileName', deleteFile);
router.post('/folder', createFolder);
router.put('/rename', renameItem);
router.post('/copy', copyItem);
router.get('/download/:fileName', downloadFile);

module.exports = router; 