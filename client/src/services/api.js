import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const uploadFile = async (file, onProgress, signal) => {
  const formData = new FormData();
  formData.append('file', file);

  // Use fetch for SSE support
  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
    signal // Add AbortSignal for cancellation support
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const events = decoder.decode(value).split('\n\n');
      for (const event of events) {
        if (!event.trim() || !event.startsWith('data: ')) continue;
        
        try {
          const data = JSON.parse(event.replace('data: ', ''));
          if (data.type === 'complete') {
            onProgress(data.data.size, data.data.size); // Send final progress
            return data;
          } else if (data.type === 'error') {
            throw new Error(data.error);
          } else {
            // Send both loaded and total bytes for speed calculation
            onProgress(data.loaded, data.total);
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            throw error; // Re-throw abort errors
          }
          console.error('Error parsing progress event:', error);
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error; // Re-throw abort errors
    }
    throw new Error(`Upload failed: ${error.message}`);
  } finally {
    reader.cancel(); // Clean up the reader
  }
};

export const listFiles = async (prefix = '', limit = 100) => {
  const response = await api.get('/upload', {
    params: { prefix, limit },
  });
  return response.data;
};

export const deleteFile = async (fileName) => {
  const response = await api.delete(`/upload/${fileName}`);
  return response.data;
}; 