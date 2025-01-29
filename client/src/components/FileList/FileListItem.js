import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  IconButton,
  Typography,
  Paper,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import FolderIcon from '@mui/icons-material/FolderRounded';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFileRounded';
import { formatFileSize, formatDate } from '../../utils/formatters';

const FileListItem = ({ item, onDelete, onFolderClick, currentPath, viewMode = 'list' }) => {
  const isFolder = item.type === 'folder';
  const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;

  const handleClick = () => {
    if (isFolder) {
      onFolderClick(fullPath);
    }
  };

  if (viewMode === 'grid') {
    return (
      <Paper
        elevation={isFolder ? 2 : 1}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 2,
          cursor: isFolder ? 'pointer' : 'default',
          transition: 'all 0.2s ease-in-out',
          bgcolor: isFolder ? 'primary.light' : 'background.paper',
          '&:hover': {
            transform: isFolder ? 'translateY(-4px)' : 'none',
            bgcolor: isFolder ? 'primary.light' : 'background.paper',
            elevation: isFolder ? 4 : 2
          },
          position: 'relative',
          height: '100%',
        }}
        onClick={handleClick}
      >
        {isFolder ? (
          <FolderIcon 
            sx={{ 
              fontSize: 64,
              color: 'primary.main',
              mb: 1,
            }} 
          />
        ) : (
          <InsertDriveFileIcon 
            sx={{ 
              fontSize: 48,
              color: 'text.secondary',
              mb: 1,
            }} 
          />
        )}
        <Typography 
          variant="body1" 
          align="center"
          sx={{ 
            fontWeight: isFolder ? 600 : 400,
            color: isFolder ? 'primary.dark' : 'text.primary',
            mb: 0.5,
            wordBreak: 'break-word',
          }}
        >
          {item.originalName || item.name}
        </Typography>
        {!isFolder && (
          <Typography variant="caption" color="textSecondary" align="center">
            {formatFileSize(item.size)}
          </Typography>
        )}
        {!isFolder && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
              opacity: 0,
              transition: 'opacity 0.2s',
              '.MuiPaper-root:hover &': {
                opacity: 1,
              },
            }}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(item.url, '_blank');
              }}
              sx={{
                color: 'primary.main',
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'primary.light',
                }
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.name);
              }}
              sx={{
                color: 'error.main',
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'error.light',
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={isFolder ? 2 : 1}
      sx={{ 
        mb: 1.5,
        transition: 'all 0.2s ease-in-out',
        bgcolor: isFolder ? 'primary.light' : 'background.paper',
        '&:hover': {
          transform: isFolder ? 'translateX(8px)' : 'none',
          bgcolor: isFolder ? 'primary.light' : 'background.paper',
          elevation: isFolder ? 4 : 2
        },
      }}
    >
      <ListItem
        sx={{
          cursor: isFolder ? 'pointer' : 'default',
          borderRadius: 1,
          py: 1.5,
        }}
        onClick={handleClick}
      >
        <ListItemIcon>
          {isFolder ? (
            <FolderIcon 
              sx={{ 
                fontSize: 40,
                color: 'primary.main',
                transition: 'transform 0.2s ease-in-out',
                transform: 'scale(1.2)',
                '&:hover': {
                  transform: 'scale(1.3)',
                }
              }} 
            />
          ) : (
            <InsertDriveFileIcon 
              sx={{ 
                fontSize: 30,
                color: 'text.secondary'
              }} 
            />
          )}
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: isFolder ? 600 : 400,
                color: isFolder ? 'primary.dark' : 'text.primary',
                fontSize: isFolder ? '1rem' : '0.95rem'
              }}
            >
              {item.originalName || item.name}
            </Typography>
          }
          secondary={
            !isFolder && (
              <Typography variant="body2" color="textSecondary">
                Size: {formatFileSize(item.size)} | Uploaded:{' '}
                {formatDate(item.lastModified)}
              </Typography>
            )
          }
        />
        <ListItemSecondaryAction>
          {!isFolder && (
            <>
              <IconButton
                edge="end"
                aria-label="download"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.url, '_blank');
                }}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    color: 'primary.dark',
                  }
                }}
              >
                <DownloadIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.name);
                }}
                sx={{
                  color: 'error.light',
                  '&:hover': {
                    color: 'error.main',
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </ListItemSecondaryAction>
      </ListItem>
    </Paper>
  );
};

export default FileListItem; 