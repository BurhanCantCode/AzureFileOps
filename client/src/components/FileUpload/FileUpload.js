import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Paper,
  Typography,
  LinearProgress,
  Box,
  Alert,
  IconButton,
  Button,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
import { uploadFile } from '../../services/api';
import { MAX_FILE_SIZE, formatBytes, formatTime } from '../../constants';

const FileUpload = ({ onUploadSuccess, onUploadError }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const uploadStartTime = useRef(0);
  const lastUploadedBytes = useRef(0);
  const lastUpdateTime = useRef(0);
  const abortController = useRef(null);

  const calculateProgress = (loaded, total, timestamp) => {
    const elapsedTime = (timestamp - uploadStartTime.current) / 1000; // in seconds
    const bytesPerSecond = loaded / elapsedTime;
    
    // Calculate speed using a moving average
    if (timestamp - lastUpdateTime.current >= 1000) { // Update every second
      const instantSpeed = (loaded - lastUploadedBytes.current) / ((timestamp - lastUpdateTime.current) / 1000);
      setUploadSpeed(instantSpeed);
      
      // Estimate time remaining
      const remainingBytes = total - loaded;
      const remainingTime = remainingBytes / instantSpeed;
      setTimeRemaining(remainingTime);
      
      lastUploadedBytes.current = loaded;
      lastUpdateTime.current = timestamp;
    }
    
    return Math.round((loaded * 100) / total);
  };

  const handleCancel = () => {
    if (abortController.current) {
      abortController.current.abort();
      setError('Upload cancelled');
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentFile(null);
    }
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit (max: ${formatBytes(MAX_FILE_SIZE)})`);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      validateFile(file);
      
      setCurrentFile(file);
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      setUploadSpeed(0);
      setTimeRemaining(0);
      
      uploadStartTime.current = Date.now();
      lastUpdateTime.current = Date.now();
      lastUploadedBytes.current = 0;
      abortController.current = new AbortController();

      const result = await uploadFile(
        file,
        (loaded, total) => {
          const progress = calculateProgress(loaded, total, Date.now());
          setUploadProgress(prev => Math.max(prev, progress));
        },
        abortController.current.signal
      );
      
      setUploadProgress(100);
      onUploadSuccess?.(result.data);
    } catch (err) {
      const message = err.name === 'AbortError' 
        ? 'Upload cancelled'
        : (err.message || 'Upload failed');
      setError(message);
      onUploadError?.(message);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentFile(null);
        setUploadSpeed(0);
        setTimeRemaining(0);
        abortController.current = null;
      }, 1000);
    }
  }, [onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <Box sx={{ mb: 3 }}>
      {error && (
        <Alert
          severity="error"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          opacity: isUploading ? 0.7 : 1,
          pointerEvents: isUploading ? 'none' : 'auto',
        }}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Drop the file here'
            : 'Drag & drop a file here, or click to select'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {currentFile 
            ? `Uploading: ${currentFile.name} (${formatBytes(currentFile.size)})`
            : `Maximum file size: ${formatBytes(MAX_FILE_SIZE)}`}
        </Typography>
      </Paper>

      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{
                height: 8,
                borderRadius: 4,
                flexGrow: 1,
                mr: 2,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
            <Typography variant="body2" color="textSecondary">
              {uploadProgress < 100 
                ? `Uploading... ${uploadProgress}%`
                : 'Finalizing upload...'}
            </Typography>
            {uploadSpeed > 0 && (
              <Typography variant="body2" color="textSecondary">
                {formatBytes(uploadSpeed)}/s
                {timeRemaining > 0 && ` • ${formatTime(timeRemaining)} remaining`}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload; 