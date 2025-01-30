#!/bin/bash

# ----------------------
# KUDU Deployment Script
# Version: 1.0.17
# ----------------------

# Helpers
# -------

exitWithMessageOnError () {
  if [ ! $? -eq 0 ]; then
    echo "An error has occurred during web site deployment."
    echo $1
    exit 1
  fi
}

# Setup
# -----

SCRIPT_DIR="${BASH_SOURCE[0]%\\*}"
SCRIPT_DIR="${SCRIPT_DIR%/*}"
ARTIFACTS=$SCRIPT_DIR/../artifacts
KUDU_SYNC_CMD=${KUDU_SYNC_CMD//\"}

if [[ ! -n "$DEPLOYMENT_SOURCE" ]]; then
  DEPLOYMENT_SOURCE=$SCRIPT_DIR
fi

if [[ ! -n "$NEXT_MANIFEST_PATH" ]]; then
  NEXT_MANIFEST_PATH=$ARTIFACTS/manifest

  if [[ ! -n "$PREVIOUS_MANIFEST_PATH" ]]; then
    PREVIOUS_MANIFEST_PATH=$NEXT_MANIFEST_PATH
  fi
fi

if [[ ! -n "$DEPLOYMENT_TARGET" ]]; then
  DEPLOYMENT_TARGET=$ARTIFACTS/wwwroot
else
  KUDU_SERVICE=true
fi

# Install Kudu Sync if not present
if [[ ! -n "$KUDU_SYNC_CMD" ]]; then
  echo Installing Kudu Sync
  npm install kudusync -g --silent
  exitWithMessageOnError "npm failed"
  KUDU_SYNC_CMD="kudusync"
fi

##################################################################################################################################
# Deployment
# ----------

echo "Handling node.js deployment."

# 1. Install dependencies
cd "$DEPLOYMENT_SOURCE"
echo "Installing root dependencies..."
npm install
exitWithMessageOnError "Root npm install failed"

# 2. Build client
cd "$DEPLOYMENT_SOURCE/client"
echo "Installing client dependencies..."
npm install
exitWithMessageOnError "Client npm install failed"
echo "Building client..."
CI=false npm run build
exitWithMessageOnError "Client build failed"

# 3. Install server dependencies
cd "$DEPLOYMENT_SOURCE/server"
echo "Installing server dependencies..."
npm install --production
exitWithMessageOnError "Server npm install failed"

# 4. Copy client build to server
mkdir -p "$DEPLOYMENT_SOURCE/server/public"
cp -r "$DEPLOYMENT_SOURCE/client/build/"* "$DEPLOYMENT_SOURCE/server/public/"

# 5. KuduSync
if [[ "$IN_PLACE_DEPLOYMENT" -ne "1" ]]; then
  "$KUDU_SYNC_CMD" -v 50 -f "$DEPLOYMENT_SOURCE" -t "$DEPLOYMENT_TARGET" -n "$NEXT_MANIFEST_PATH" -p "$PREVIOUS_MANIFEST_PATH" -i ".git;.hg;.deployment;deploy.sh"
  exitWithMessageOnError "Kudu Sync failed"
fi

# 6. Start server directly (remove PM2)
cd "$DEPLOYMENT_TARGET/server"
echo "Starting server..."
node server.js

##################################################################################################################################
echo "Finished successfully."

# Install dependencies
cd server
npm install --production
cd ..

# Start the server with PM2
cd server
npm install pm2 -g
pm2 delete all || true  # Stop any existing processes
NODE_ENV=production pm2 start server.js --name server --no-daemon

# Exit immediately if a command exits with non-zero status
set -e

# Navigate to client directory and build
cd client
npm install
npm run build

# Return to root and copy build files
cd ..
mkdir -p server/public
cp -r client/build/* server/public/

# Navigate to server directory
cd server
npm install --production 