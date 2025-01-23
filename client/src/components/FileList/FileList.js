import React, { useState, useEffect } from 'react';
import {
  List,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import FileListItem from './FileListItem';
import { listFiles, deleteFile } from '../../services/api';

const FileList = ({ refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await listFiles();
      setFiles(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileName) => {
    try {
      await deleteFile(fileName);
      await fetchFiles();
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Uploaded Files
      </Typography>
      {files.length === 0 ? (
        <Typography color="textSecondary">No files uploaded yet</Typography>
      ) : (
        <List>
          {files.map((file) => (
            <FileListItem
              key={file.name}
              file={file}
              onDelete={handleDelete}
            />
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileList; 