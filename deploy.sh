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

echo Handling node.js deployment.

# 1. Install npm packages in root
if [ -e "$DEPLOYMENT_SOURCE/package.json" ]; then
  cd "$DEPLOYMENT_SOURCE"
  echo "Running npm ci in root"
  npm ci --prefer-offline --no-audit --no-fund --loglevel=error
  exitWithMessageOnError "npm failed"
  cd - > /dev/null
fi

# 2. Install and build client
if [ -e "$DEPLOYMENT_SOURCE/client/package.json" ]; then
  cd "$DEPLOYMENT_SOURCE/client"
  echo "Running npm ci in client"
  # Set npm config for faster install
  npm config set fetch-retries 3
  npm config set fetch-retry-mintimeout 5000
  npm config set fetch-retry-maxtimeout 20000
  npm ci --prefer-offline --no-audit --no-fund --loglevel=error
  exitWithMessageOnError "client npm failed"
  echo "Building client"
  npm run build --if-present
  exitWithMessageOnError "client build failed"
  cd - > /dev/null
fi

# 3. Install server packages
if [ -e "$DEPLOYMENT_SOURCE/server/package.json" ]; then
  cd "$DEPLOYMENT_SOURCE/server"
  echo "Running npm ci in server"
  npm ci --prefer-offline --no-audit --no-fund --loglevel=error
  exitWithMessageOnError "server npm failed"
  cd - > /dev/null
fi

# 4. KuduSync
if [[ "$IN_PLACE_DEPLOYMENT" -ne "1" ]]; then
  "$KUDU_SYNC_CMD" -v 50 -f "$DEPLOYMENT_SOURCE" -t "$DEPLOYMENT_TARGET" -n "$NEXT_MANIFEST_PATH" -p "$PREVIOUS_MANIFEST_PATH" -i ".git;.hg;.deployment;deploy.sh"
  exitWithMessageOnError "Kudu Sync failed"
fi

##################################################################################################################################
echo "Finished successfully." 