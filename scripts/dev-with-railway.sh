#!/bin/bash

# Development script that runs the app with Railway environment variables
# This allows you to use Railway's Redis from your local machine

echo "🚂 Starting development with Railway environment..."
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "   Install it with: npm install -g @railway/cli"
    echo "   Or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

# Check if linked to a Railway project
if ! railway status &> /dev/null; then
    echo "❌ Not linked to a Railway project"
    echo "   Run: railway link"
    echo "   Then select your project and environment"
    exit 1
fi

echo "✅ Railway CLI detected and linked"
echo ""

# Show which environment we're using
echo "📋 Railway Environment:"
railway status
echo ""

# Run the command with Railway environment
echo "🚀 Starting development server with Railway environment..."
echo ""

# You can change this to run workers instead: railway run bun run workers
railway run bun run dev