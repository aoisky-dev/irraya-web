#!/bin/bash
set -e

# Configuration
SERVER="kvm"
REMOTE_DIR="~/irraya-web"

echo "🚀 Starting deployment to $SERVER..."

# 1. Sync the environment variables
echo "⚙️ Syncing environment files..."
cp ./backend/.env ./deploy/prod/backend.env
if [ -f ./frontend/.env.production ]; then
  cp ./frontend/.env.production ./deploy/prod/frontend.env
elif [ -f ./frontend/.env.local ]; then
  cp ./frontend/.env.local ./deploy/prod/frontend.env
fi

# 2. Sync the latest code to the server (excluding node_modules, .next, etc.)
echo "📦 Syncing files..."
rsync -avz \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '.medusa' \
    --exclude 'tsconfig.tsbuildinfo' \
    --exclude '/images' \
    --exclude '/optimized_images' \
    ./ $SERVER:$REMOTE_DIR

# 2. Rebuild and restart the Docker containers on the server
echo "🐳 Rebuilding Docker containers on the server (this may take a few minutes)..."
ssh $SERVER "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml up -d --build"

echo "✅ Deployment complete! Your changes are now live."
