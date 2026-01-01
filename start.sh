#!/bin/bash

# Fabric Toolbox Dashboard - Start Script
# This script installs dependencies and starts the development server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  Fabric Toolbox Dashboard"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[1/2] Installing dependencies..."
    npm install
    echo ""
else
    echo "[1/2] Dependencies already installed"
fi

echo "[2/2] Starting development server..."
echo ""
echo "  Dashboard will be available at:"
echo "  http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop"
echo "=========================================="
echo ""

npm run dev
