#!/bin/bash
# Custom build script for Nixpacks with Bun

echo "🚀 Building with Bun..."

# Install dependencies
echo "📦 Installing dependencies..."
bun install --frozen-lockfile

# Build the Next.js app
echo "🔨 Building Next.js application..."
bun run build

# Show build info
echo "✅ Build completed successfully!"
echo "Bun version: $(bun --version)"
echo "Node version: $(node --version)"