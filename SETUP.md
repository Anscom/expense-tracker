# Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Expo CLI (installed globally or via npx)
- Expo Go app on your mobile device (for testing)

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection string
npm run dev
```

The backend will start on `http://localhost:3000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Then:
- Scan QR code with Expo Go app (iOS/Android)
- Or press `i` for iOS simulator
- Or press `a` for Android emulator

### 3. MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to `backend/.env`

### 4. Update API Configuration

In `frontend/config/api.js`, update the `API_BASE_URL`:
- For local development: `http://localhost:3000/api`
- For physical device: Use your computer's local IP (e.g., `http://192.168.1.100:3000/api`)
- For production: Your deployed backend URL

### 5. Required Assets

The app expects these assets in `frontend/assets/`:
- `icon.png` (1024x1024)
- `splash.png` (1284x2778)
- `adaptive-icon.png` (1024x1024)
- `favicon.png` (48x48)

You can generate these using [Expo's asset generator](https://docs.expo.dev/guides/app-icons/) or create placeholder images for development.

## Testing the Application

1. Start the backend server
2. Start the frontend Expo server
3. Open the app on your device/simulator
4. Add a budget in Settings
5. Add some expenses
6. View insights and streak on Home screen
7. Check weekly review

## Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env`
- Ensure MongoDB Atlas IP whitelist includes your IP
- Check if port 3000 is available

### Frontend can't connect to backend
- Verify backend is running
- Check API_BASE_URL in `frontend/config/api.js`
- For physical device, use your computer's local IP, not localhost
- Ensure firewall allows connections on port 3000

### Expo issues
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Development Tips

- Use `npm run dev` in backend for auto-reload
- Use Expo's hot reload for frontend changes
- Check backend logs for API errors
- Use React Native Debugger for frontend debugging
