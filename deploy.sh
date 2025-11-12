#!/bin/bash

echo "======================================"
echo "   REBA Quick Deployment Script"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo ""
    echo "🔑 IMPORTANT: Edit .env file and add your RapidAPI key"
    echo "   Get your key from: https://rapidapi.com/apidojo/api/realty-in-us"
    echo ""
    read -p "Press Enter after adding your API key to continue..."
fi

# Start the backend
echo ""
echo "🚀 Starting REBA backend server..."
echo "   Backend will run on: http://localhost:3001"
echo ""
echo "📱 To access REBA:"
echo "   1. Keep this terminal running"
echo "   2. Open index.html in your browser"
echo "   3. Or visit http://localhost:3001 if you set up a web server"
echo ""
echo "🎤 Ready to use voice commands!"
echo "   Try: 'Show me homes for sale in Miami'"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start