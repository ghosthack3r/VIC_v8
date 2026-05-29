#!/bin/bash
# VIC v5 — Linux / macOS Quickstart Script
# Run with: bash setup-vic.sh

echo "🚀 VIC v5 Quickstart (Linux/macOS)"
echo "=================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: v$(npm --version)"

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo ""
echo "🔧 Rebuilding native modules..."
npm run rebuild

if [ $? -ne 0 ]; then
    echo "⚠️  Rebuild failed. On Linux, try:"
    echo "   sudo apt install build-essential python3"
    echo "   Then run this script again."
    exit 1
fi

echo ""
echo "✅ Native modules rebuilt!"

# Setup .env
if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    echo "📄 Created .env from .env.example"
    echo "   → Edit .env and add your Google Maps API key"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add VITE_GOOGLE_MAPS_API_KEY"
echo "  2. (Optional) Set GOOGLE_CLOUD_PROJECT for real Gemini"
echo "  3. Run: npm run dev"
echo ""
echo "For more help, see QUICKSTART.md"
echo ""
echo "Drive safe. VIC is standing by. 🚔"
