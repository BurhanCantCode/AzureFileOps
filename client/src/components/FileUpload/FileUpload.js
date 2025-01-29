import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Stack,
} from '@mui/material';
import { uploadFile } from '../../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const FileUpload = ({ onUploadSuccess, onUploadError, currentPath }) => {
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadingFiles(acceptedFiles.map(file => ({
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    })));

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        try {
          const formData = new FormData();
          formData.append('file', file);
          if (currentPath && currentPath.trim()) {
            formData.append('path', currentPath.trim());
          }

          // Use the uploadFile function from api.js instead of XMLHttpRequest
          const response = await uploadFile(file, currentPath, (progress) => {
            setUploadingFiles(prev => prev.map((f, index) => 
              index === i ? { ...f, progress, status: 'uploading' } : f
            ));
          });

          if (response?.data) {
            setUploadingFiles(prev => prev.map((f, index) => 
              index === i ? { ...f, progress: 100, status: 'completed' } : f
            ));
            onUploadSuccess(response.data);
          }
        } catch (err) {
          console.error('Error uploading file:', file.name, err);
          setError(`Failed to upload ${file.name}: ${err.message}`);
          setUploadingFiles(prev => prev.map((f, index) => 
            index === i ? { ...f, status: 'error' } : f
          ));
          onUploadError(err);
        }
      }
    } finally {
      // Keep the completed status visible for a moment before clearing
      setTimeout(() => {
        setIsUploading(false);
        setUploadingFiles([]);
      }, 2000);
    }
  }, [currentPath, onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 3,
        bgcolor: 'primary.light',
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'primary.light'
      }}
    >
      <Box
        {...getRootProps()}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'primary.light',
          },
        }}
      >
        <input {...getInputProps()} />
        <Typography color="primary" sx={{ mb: 1 }}>
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag and drop files here, or click to select files'}
        </Typography>
        
        {uploadingFiles.length > 0 && (
          <Stack spacing={1} sx={{ mt: 2 }}>
            {uploadingFiles.map((file, index) => (
              <Box key={index} sx={{ width: '100%' }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {file.name} - {file.status === 'completed' ? 'Completed' : 
                    file.status === 'error' ? 'Failed' : 
                    `${file.progress}%`}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={file.progress}
                  color={file.status === 'error' ? 'error' : 
                         file.status === 'completed' ? 'success' : 'primary'}
                />
              </Box>
            ))}
          </Stack>
        )}
        
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Paper>
  );
};

export default FileUpload; 