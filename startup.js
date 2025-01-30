const { exec } = require('child_process');
const path = require('path');

const startServer = () => {
  const serverPath = path.join(__dirname, 'server', 'server.js');
  console.log('Starting server from:', serverPath);
  
  exec(`pm2 start ${serverPath} --name server --no-daemon`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error starting server:', error);
      return;
    }
    console.log('Server started:', stdout);
  });
};

startServer(); 