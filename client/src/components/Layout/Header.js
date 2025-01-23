import React from 'react';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const Header = () => {
  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <CloudUploadIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div">
            Azure File Upload
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 