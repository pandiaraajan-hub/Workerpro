#!/bin/bash

# Build the application
npm run build

# Copy frontend files to root for Vercel
cp dist/public/index.html .
cp -r dist/public/assets .

echo "Build completed and files copied for Vercel deployment"