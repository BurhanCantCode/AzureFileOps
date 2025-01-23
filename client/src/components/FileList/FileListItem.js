import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { formatFileSize, formatDate } from '../../utils/formatters';

const FileListItem = ({ file, onDelete }) => {
  return (
    <ListItem
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
      }}
    >
      <ListItemText
        primary={file.originalName || file.name}
        secondary={
          <>
            <Typography component="span" variant="body2" color="textSecondary">
              Size: {formatFileSize(file.size)} | Uploaded:{' '}
              {formatDate(file.lastModified)}
            </Typography>
          </>
        }
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          aria-label="download"
          onClick={() => window.open(file.url, '_blank')}
        >
          <DownloadIcon />
        </IconButton>
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => onDelete(file.name)}
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default FileListItem; 