# REBA - Real Estate Bot Assistant

Voice-activated real estate search application for realtors to instantly access property information, MLS data, tax assessments, and neighborhood listings.

## Features

- 🎤 **Voice Search**: Natural language voice commands
- 🏠 **Property Details**: Comprehensive property information including:
  - Price and market data
  - Bedrooms, bathrooms, square footage
  - Tax assessments and property taxes
  - Days on market and MLS numbers
  - HOA fees and property descriptions
- 📍 **Neighborhood Search**: Find homes for sale in any area
- 🎨 **Modern UI**: Clean, responsive design with dark theme
- 🔒 **Secure API**: Backend proxy to protect API keys

## Quick Start

### Prerequisites
- Node.js 14+ installed
- RapidAPI account and key

### Installation

1. **Clone or download this project**
   ```bash
   cd reba-deployment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add your RapidAPI key:
   ```
   RAPIDAPI_KEY=your_rapidapi_key_here
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```
   Server runs on http://localhost:3001

5. **Open the frontend**
   - Open `index.html` in your browser
   - Or use a local server:
   ```bash
   npx serve .
   ```

## Getting Your RapidAPI Key

1. Go to [RapidAPI Realty-in-US](https://rapidapi.com/apidojo/api/realty-in-us)
2. Click "Subscribe to Test"
3. Choose a plan (Basic is free with 500 requests/month)
4. Copy your API key from the dashboard

## Usage Examples

### Voice Commands
- "Show me 123 Main Street Miami"
- "Property information for 456 Oak Avenue Los Angeles"
- "Homes for sale in Beverly Hills"
- "Find properties in Manhattan"

### Text Search
- Enter any address: "789 Park Ave, New York, NY"
- Search neighborhoods: "Homes in Austin, TX"

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to:
- Vercel
- Netlify
- Custom domain (rebaapp.com)

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **APIs**: RapidAPI Realty-in-US
- **Voice**: Web Speech API

## Project Structure

```
reba-deployment/
├── index.html          # Main frontend file
├── styles.css          # Styling
├── app.js             # Frontend JavaScript
├── server.js          # Backend API server
├── package.json       # Node dependencies
├── .env.example       # Environment template
├── vercel.json        # Vercel config
├── DEPLOYMENT.md      # Deployment guide
└── README.md          # This file
```

## Troubleshooting

### API Returns "N/A" Values
- Verify your RapidAPI key is correct
- Check you're subscribed to the API
- Ensure the backend server is running

### Voice Recognition Not Working
- Use Chrome or Edge browser
- Allow microphone permissions
- Check HTTPS connection (required for voice)

### CORS Errors
- Make sure backend is running on port 3001
- Check frontend is accessing correct backend URL

## License

MIT

## Support

For API issues, check your [RapidAPI dashboard](https://rapidapi.com/developer/dashboard)

---

Built with ❤️ for real estate professionals