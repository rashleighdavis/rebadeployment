@echo off
echo ======================================
echo    REBA Quick Deployment Script
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo X Node.js is not installed. Please install Node.js first.
    echo   Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo OK Node.js detected
node -v
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
echo.

REM Check for .env file
if not exist .env (
    echo No .env file found. Creating from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit .env file and add your RapidAPI key
    echo Get your key from: https://rapidapi.com/apidojo/api/realty-in-us
    echo.
    echo Press any key after adding your API key to continue...
    pause >nul
)

REM Start the backend
echo.
echo Starting REBA backend server...
echo Backend will run on: http://localhost:3001
echo.
echo To access REBA:
echo   1. Keep this window open
echo   2. Open index.html in your browser
echo   3. Or visit http://localhost:3001 if you set up a web server
echo.
echo Ready to use voice commands!
echo Try: 'Show me homes for sale in Miami'
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start