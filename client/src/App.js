import React, { useState } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/Layout/Header';
import FileUpload from './components/FileUpload/FileUpload';
import FileList from './components/FileList/FileList';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={(error) => console.error(error)}
        />
        <FileList refreshTrigger={refreshTrigger} />
      </Container>
    </ThemeProvider>
  );
}

export default App; 