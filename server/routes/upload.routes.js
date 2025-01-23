const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { uploadFile, listFiles, deleteFile } = require('../controllers/upload.controller');

router.post('/', upload.single('file'), uploadFile);
router.get('/', listFiles);
router.delete('/:fileName', deleteFile);

module.exports = router; 