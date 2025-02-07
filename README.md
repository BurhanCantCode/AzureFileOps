# Azure File Uploader Application

A modern web application for managing files in Azure Blob Storage with features like drag-and-drop upload, folder creation, and file management.

## Features

- 📁 Folder creation and navigation
- 📤 Drag-and-drop file upload
- 📊 Progress tracking for large files
- 🔄 Chunked upload for files > 100MB
- 📋 File/folder operations (rename, delete, copy)
- 🎯 Concurrent uploads for better performance
- 🔒 Secure Azure Blob Storage integration

## Prerequisites

- Node.js >=18.0.0
- npm >=9.0.0
- Azure Account with active subscription
- Azure Storage Account
- Azure App Service (P1v2 plan recommended for production)

## Azure Storage Setup

1. Create an Azure Storage Account:
   - Go to Azure Portal (https://portal.azure.com)
   - Click "Create a resource" → "Storage" → "Storage account"
   - Fill in the basics:
     * Subscription: Your subscription
     * Resource group: Create new or select existing
     * Storage account name: Unique name (lowercase letters and numbers)
     * Region: Choose closest to your users
     * Performance: Standard
     * Redundancy: LRS (or your preference)
     * Enable hierarchical namespace: No

2. Configure CORS for Azure Storage:
   - Navigate to your Storage Account
   - Click on "Settings" → "Resource sharing (CORS)"
   - Add a new CORS rule with these exact settings:
   ```json
   {
     "AllowedOrigins": ["*"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
     "AllowedHeaders": ["*"],
     "ExposedHeaders": ["*"],
     "MaxAgeInSeconds": 3600
   }
   ```

3. Create a Container:
   - Go to "Containers" in your storage account
   - Click "+ Container"
   - Name: Choose a unique name
   - Public access level: "Container" (for development) or "Private" (for production)
   - Click "Create"

4. Get Connection String:
   - Go to "Access keys" under "Security + networking"
   - Click "Show" next to "Connection string"
   - Copy the connection string for the next step

## Local Development Setup

1. Clone the repository:

```bash
git clone https://github.com/BurhanCantCode/AzureFileOps
cd azure-uploader
```

2. Create environment files:

Create `.env` in the server directory:
```plaintext
PORT=3001
NODE_ENV=development
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_CONTAINER_NAME=your_container_name
MAX_FILE_SIZE=53687091200
```

Create `.env` in the client directory:
```plaintext
REACT_APP_API_URL=http://localhost:3001/api
```

3. Install dependencies:
```bash
npm run install-all
```

4. Start development servers:
```bash
# Terminal 1 - Start client
cd client
npm start

# Terminal 2 - Start server
cd server
npm run dev
```

## Azure App Service Deployment

1. Create an App Service:
   - Go to Azure Portal
   - Create a new "Web App" resource
   - Configure basic settings:
     * Runtime stack: Node.js 18 LTS
     * Operating System: Linux
     * Region: Same as your storage account
     * Pricing Plan: P1v2 or higher (recommended for production)

2. Configure App Service Settings:
   - Go to Configuration → Application settings
   - Add these required settings:
   ```plaintext
   AZURE_STORAGE_CONNECTION_STRING=your_connection_string
   AZURE_STORAGE_CONTAINER_NAME=your_container_name
   WEBSITES_NODE_DEFAULT_VERSION=~18
   WEBSITE_NODE_DEFAULT_VERSION=~18
   NODE_ENV=production
   MAX_FILE_SIZE=53687091200
   SCM_DO_BUILD_DURING_DEPLOYMENT=true
   WEBSITE_HTTPLOGGING_RETENTION_DAYS=7
   WEBSITE_RUN_FROM_PACKAGE=1
   ```

3. Configure CORS in App Service:
   - Go to CORS under API
   - Add these settings:
     * Allowed Origins: Your client application URL or "*" for development
     * Allowed Methods: Select all (GET, POST, PUT, DELETE, etc.)
     * Allowed Headers: "*"
     * Exposed Headers: "*"
     * Max Age (seconds): 3600
   - Enable Access-Control-Allow-Credentials

4. Enable Diagnostic Logging:
   - Go to "App Service logs"
   - Enable "Application logging"
   - Enable "Web server logging"
   - Set retention period to 7 days
   - Enable "Detailed error messages"
   - Enable "Failed request tracing"

5. Deploy using GitHub Actions:

Create `.github/workflows/azure-deploy.yml`:
```yaml
name: Azure Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install Dependencies
      run: |
        npm run install-all
        
    - name: Build Client
      run: |
        cd client
        npm run build
        
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: your-app-name
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
```

6. Configure deployment settings:
   - Enable SCM Basic Auth Publishing
   - Get publish profile from App Service
   - Add as GitHub secret: AZURE_WEBAPP_PUBLISH_PROFILE

## Important Configuration Files

1. Web.config for IIS:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server/server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="StaticContent">
          <action type="Rewrite" url="server/public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server/server.js"/>
        </rule>
      </rules>
    </rewrite>
    <iisnode 
      nodeProcessCommandLine="node --max-old-space-size=4096"
      maxConcurrentRequestsPerProcess="1024"
      watchedFiles="*.js;web.config"
    />
  </system.webServer>
</configuration>
```

2. PM2 Configuration (ecosystem.config.js):
```javascript
module.exports = {
  apps: [{
    name: 'server',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
};
```

## Troubleshooting

1. CORS Issues:
   - Verify CORS settings in both Azure Storage and App Service
   - Check if client URL is properly allowed
   - Ensure all required headers are allowed

2. Upload Failures:
   - Check file size limits in both client and server
   - Verify storage connection string
   - Check container permissions

3. Performance Issues:
   - Enable compression in App Service
   - Configure proper cache headers
   - Use P1v2 or higher SKU for better performance

## Security Best Practices

1. Storage Account Security:
   - Use Private Endpoints in production
   - Enable "Secure transfer required"
   - Use Managed Identities instead of connection strings
   - Implement SAS tokens with expiration for client-side access
   - Regular key rotation
   - Enable soft delete for blobs

2. App Service Security:
   - Enable "HTTPS Only"
   - Set minimum TLS version to 1.2
   - Use managed identity for Azure Storage access
   - Enable Azure AD authentication if required
   - Configure IP restrictions
   - Enable diagnostic logging

3. Application Security:
   - Implement file type restrictions
   - Set maximum file size limits
   - Validate all user inputs
   - Implement rate limiting
   - Use antivirus scanning for uploaded files
   - Implement proper error handling

## Performance Optimization

1. App Service Settings:
   ```plaintext
   WEBSITE_NODE_DEFAULT_VERSION=~18
   WEBSITE_HTTPLOGGING_RETENTION_DAYS=7
   WEBSITE_RUN_FROM_PACKAGE=1
   ```

2. Enable Compression:
   - Enable dynamic compression in App Service
   - Configure proper cache headers
   - Use CDN for static content

3. Storage Optimization:
   - Use chunked uploads for large files
   - Implement concurrent uploads
   - Use appropriate tier for expected traffic
   - Consider geo-replication for global access

## Monitoring

1. Enable Application Insights:
   - Add instrumentation key to app settings
   - Monitor server performance
   - Track file upload metrics

2. Storage Analytics:
   - Enable Storage logging
   - Monitor bandwidth usage
   - Track operations metrics

## Support

For issues and feature requests, please create an issue in the repository.

## License

MIT
