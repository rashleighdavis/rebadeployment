# REBA Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Frontend Deployment

1. **Prepare Frontend Files**
   - Keep only these files for frontend:
     - `index.html`
     - `styles.css`
     - `app.js`

2. **Update Backend URL in app.js**
   - Line 140 in app.js, change the backendUrl to your deployed backend:
   ```javascript
   const backendUrl = window.location.hostname === 'localhost' 
       ? 'http://localhost:3001'
       : 'https://your-backend-url.vercel.app';  // Update this
   ```

3. **Deploy Frontend to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   
   # Follow prompts, set project name to "reba-frontend"
   ```

### Backend Deployment

1. **Create Separate Backend Folder**
   ```bash
   mkdir reba-backend
   cd reba-backend
   ```

2. **Copy Backend Files**
   - Copy these files to backend folder:
     - `server.js`
     - `package.json`
     - `.env.example` (rename to `.env.local` for Vercel)

3. **Create vercel.json**
   Create this file in backend folder:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

4. **Deploy Backend to Vercel**
   ```bash
   vercel
   # Follow prompts, set project name to "reba-backend"
   ```

5. **Add Environment Variables**
   - Go to Vercel Dashboard > Your Backend Project > Settings > Environment Variables
   - Add: `RAPIDAPI_KEY` = your_actual_api_key

6. **Update CORS in server.js**
   Add your frontend URL to CORS origins:
   ```javascript
   app.use(cors({
       origin: [
           'https://reba-frontend.vercel.app',  // Add your frontend URL
           'https://rebaapp.com',
           'https://www.rebaapp.com'
       ]
   }));
   ```

## Deploy to Your Custom Domain (rebaapp.com)

### Option 1: Using Netlify (Simple)

1. **Create netlify.toml**
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://your-backend.vercel.app/api/:splat"
     status = 200
   ```

2. **Deploy to Netlify**
   ```bash
   # Install Netlify CLI
   npm i -g netlify-cli
   
   # Deploy
   netlify deploy --prod
   ```

3. **Configure Custom Domain**
   - In Netlify Dashboard > Domain Settings
   - Add custom domain: rebaapp.com
   - Update DNS settings as instructed

### Option 2: Using GitHub Pages + Vercel Backend

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "REBA deployment"
   git remote add origin https://github.com/yourusername/reba.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to Settings > Pages
   - Source: Deploy from branch (main)
   - Add custom domain: rebaapp.com

3. **Backend stays on Vercel**
   - Keep backend deployed on Vercel
   - Update frontend to use Vercel backend URL

## Environment Variables Setup

### Required Variables:
```
RAPIDAPI_KEY=your_rapidapi_key_here
PORT=3001
```

### Get Your RapidAPI Key:
1. Go to https://rapidapi.com/apidojo/api/realty-in-us
2. Click "Subscribe to Test"
3. Choose a plan (Basic is free)
4. Copy your API key from the dashboard

## Testing Your Deployment

1. **Test Backend Health**
   ```
   curl https://your-backend-url/api/health
   ```

2. **Test Frontend**
   - Open your deployed URL
   - Try a search: "123 Main Street, Miami"
   - Check browser console for any errors

## Troubleshooting

### "API Key Invalid" Error
- Check environment variable is set correctly in Vercel
- Verify API key is active on RapidAPI dashboard
- Make sure you're subscribed to the API

### CORS Errors
- Ensure frontend URL is added to CORS origins in server.js
- Redeploy backend after updating CORS settings

### "Cannot GET /" Error
- This is normal for the backend - it only serves API endpoints
- Frontend should be accessed via its own URL

### Search Returns Demo Data
- Check API key is correct
- Verify you're subscribed to Realty-in-US API
- Check RapidAPI dashboard for usage limits

## Quick Commands Reference

```bash
# Local Development
npm install
npm start

# Deploy Frontend
vercel --prod

# Deploy Backend
cd reba-backend
vercel --prod

# Check Logs
vercel logs your-project-name

# Add Environment Variable
vercel env add RAPIDAPI_KEY
```

## Support

- API Issues: Check RapidAPI dashboard
- Deployment Issues: Check Vercel/Netlify logs
- Domain Issues: Verify DNS settings

Remember to regenerate your API key if it was exposed in any commits!