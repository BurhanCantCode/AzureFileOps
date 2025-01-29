import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { formatBytes } from '../../utils/formatters';
import { listFiles, deleteFile, createFolder, uploadFile } from '../../services/api';

const FileList = ({ refreshTrigger, currentPath, onPathChange }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await listFiles(currentPath);
      setFiles(Array.isArray(response?.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPath]);

  const handleCreateFolder = async () => {
    try {
      if (!newFolderName.trim()) {
        setError('Folder name cannot be empty');
        return;
      }

      // Remove any leading/trailing slashes and spaces
      const sanitizedFolderName = newFolderName.trim().replace(/^\/+|\/+$/g, '');
      const sanitizedCurrentPath = currentPath?.trim().replace(/^\/+|\/+$/g, '');
      
      // Construct the full path
      const folderPath = sanitizedCurrentPath 
        ? `${sanitizedCurrentPath}/${sanitizedFolderName}`
        : sanitizedFolderName;

      console.log('Creating folder with path:', folderPath); // Debug log
      
      const response = await createFolder(folderPath);
      if (response?.data && Array.isArray(response.data)) {
        // Add the new folder to the current list
        setFiles(prevFiles => [...prevFiles, ...response.data]);
      }
      setCreateFolderOpen(false);
      setNewFolderName('');
      await fetchFiles(); // Refresh the list to show the new folder
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err.message || 'Failed to create folder');
    }
  };

  const handleDelete = async (item) => {
    try {
      setIsDeleting(true);
      await deleteFile(item.path);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      await fetchFiles();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(`Failed to delete ${item.isDirectory ? 'folder' : 'file'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNavigateToFolder = (folderPath) => {
    onPathChange(folderPath);
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    
    // Split path and remove last segment
    const pathParts = currentPath.split('/').filter(p => p);
    if (pathParts.length === 0) {
      onPathChange(''); // Go back to root
    } else {
      const newPath = pathParts.slice(0, -1).join('/');
      onPathChange(newPath);
    }
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    return files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger, fetchFiles]);

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Header with navigation and actions */}
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton 
            onClick={handleNavigateUp}
            disabled={!currentPath}
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            {currentPath || 'Root'}
          </Typography>
          <Button
            startIcon={<CreateNewFolderIcon />}
            variant="contained"
            onClick={() => setCreateFolderOpen(true)}
          >
            New Folder
          </Button>
        </Stack>

        {/* Search input */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* File and folder list */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : files.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography color="textSecondary">
              {error ? 'Error loading files' : 'No files or folders'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFiles.map((item) => (
                  <TableRow
                    key={item.path || item.name}
                    hover
                    sx={{
                      cursor: item.isDirectory ? 'pointer' : 'default',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => {
                      if (item.isDirectory) {
                        handleNavigateToFolder(item.path || item.name);
                      }
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {item.isDirectory ? (
                          <FolderIcon color="primary" />
                        ) : (
                          <FileIcon color="action" />
                        )}
                        <Typography>{item.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      {item.size ? formatBytes(item.size) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      {/* Create Folder Dialog */}
      <Dialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {itemToDelete?.isDirectory ? 'folder' : 'file'}{' '}
            "{itemToDelete?.name}"?
            {itemToDelete?.isDirectory && (
              <strong> This will also delete all contents inside the folder.</strong>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setItemToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(itemToDelete)}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FileList; 