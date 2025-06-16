# 🚀 Localhost Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
The project automatically detects localhost and uses the correct API URL:

- **Development (localhost)**: Uses `http://localhost:5000`
- **Production**: Uses `https://s89-akhil-bookaura-3.onrender.com`

### 3. Start Development Server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Environment Files

### `.env.local` (Development)
```
VITE_API_URL=http://localhost:5000
VITE_CRONOFY_CLIENT_ID=evqKb0KVoLQuItfmAzb9BAHaFvEXuDMy
VITE_CRONOFY_CLIENT_SECRET=CRN_YCvmy3sLQyDHchKSfGb2gMzm2f7ymDLO5vQjga
```

### `.env` (Production)
```
VITE_API_URL=https://s89-akhil-bookaura-3.onrender.com
VITE_CRONOFY_CLIENT_ID=evqKb0KVoLQuItfmAzb9BAHaFvEXuDMy
VITE_CRONOFY_CLIENT_SECRET=CRN_YCvmy3sLQyDHchKSfGb2gMzm2f7ymDLO5vQjga
```

## Backend Setup

Make sure your backend server is running on `http://localhost:5000` with CORS enabled for `http://localhost:5173`.

## Features Working on Localhost

✅ **All frontend features**
✅ **Google Translate** (positioned under navbar)
✅ **Book marketplace**
✅ **User authentication**
✅ **PDF/EPUB viewers**
✅ **Payment processing**
✅ **Profile management**

## Troubleshooting

### API Connection Issues
- Ensure backend is running on port 5000
- Check CORS settings on backend
- Verify `.env.local` file exists

### Translation Issues
- Google Translate banner is positioned under navbar
- Works in all browsers and Chrome profiles
- No redirects - translates in place

### Build Issues
- Run `npm run build` to test production build
- Use `npm run preview` to test built version locally
