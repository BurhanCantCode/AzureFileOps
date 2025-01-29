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

router.post('/', upload.single('file'), uploadFile);
router.get('/', listFiles);
router.delete('/:fileName', deleteFile);
router.post('/folder', createFolder);
router.put('/rename', renameItem);
router.post('/copy', copyItem);
router.get('/download/:fileName', downloadFile);

module.exports = router; 