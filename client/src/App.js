import React, { useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/Layout/Header';
import FileUpload from './components/FileUpload/FileUpload';
import FileList from './components/FileList/FileList';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#e3f2fd',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
  },
});

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentPath, setCurrentPath] = useState('');

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header currentPath={currentPath} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={(error) => console.error(error)}
          currentPath={currentPath}
        />
        <FileList 
          refreshTrigger={refreshTrigger}
          currentPath={currentPath}
          onPathChange={setCurrentPath}
        />
      </Container>
    </ThemeProvider>
  );
}

export default App; 