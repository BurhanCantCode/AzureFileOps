import React, { useCallback } from 'react';
import { listFiles } from '../services/blob.service';

const FileList = ({ refreshTrigger, currentPath, onPathChange }) => {
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      
      // Normalize the path for API request
      const normalizedPath = currentPath?.trim().replace(/^\/+|\/+$/g, '') || '';
      console.log('Fetching files for path:', normalizedPath);
      
      const response = await listFiles(normalizedPath);
      setFiles(Array.isArray(response?.data) ? response.data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  // Handle navigation
  const handleNavigate = (item) => {
    if (!item.isDir) return;
    
    // Normalize the new path
    const newPath = item.path?.trim().replace(/^\/+|\/+$/g, '') || item.name;
    console.log('Navigating to:', newPath);
    onPathChange(newPath);
  };

  // Handle back navigation
  const handleBack = () => {
    if (!currentPath) return;
    
    const parts = currentPath.split('/').filter(p => p);
    if (parts.length === 0) {
      onPathChange('');
    } else {
      const newPath = parts.slice(0, -1).join('/');
      onPathChange(newPath);
    }
  };

  // ... rest of the component code ...
};

export default FileList; 