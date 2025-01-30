import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: `${API_URL}/upload`,
  timeout: 30000,
});

export const uploadFile = async (file, path = '', onProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Only append path if it exists and is not empty
    if (path && path.trim()) {
      formData.append('path', path.trim());
    }
    
    const response = await api.post('/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(progress);
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload file');
  }
};

export const listFiles = async (path = '') => {
  try {
    const response = await api.get('/', {
      params: { path }
    });
    
    // Handle both response formats
    const data = response.data.data || response.data;
    console.log('Processed response:', data);
    
    return { data };  // Always return in consistent format
  } catch (error) {
    console.error('List files error:', error);
    throw new Error(error.response?.data?.message || 'Failed to list files');
  }
};

export const deleteFile = async (path) => {
  try {
    const response = await api.delete(`/${encodeURIComponent(path)}`);
    return response.data;
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete item');
  }
};

export const createFolder = async (path) => {
  try {
    if (!path) {
      throw new Error('Folder path is required');
    }

    const sanitizedPath = path.trim().replace(/^\/+|\/+$/g, '');
    console.log('Creating folder with sanitized path:', sanitizedPath); // Debug log

    const response = await api.post('/folder', { 
      path: sanitizedPath 
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Create folder error:', error);
    throw new Error(error.response?.data?.message || 'Failed to create folder');
  }
};

export const renameItem = async (oldPath, newPath) => {
  const response = await api.put('/rename', { oldPath, newPath });
  return response.data;
};

export const copyItem = async (sourcePath, destinationPath) => {
  const response = await api.post('/copy', { sourcePath, destinationPath });
  return response.data;
};

export const downloadFile = async (path) => {
  window.open(`${api.defaults.baseURL}/download/${encodeURIComponent(path)}`, '_blank');
}; 