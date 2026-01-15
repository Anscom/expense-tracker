# Fix for ExpoFontLoader Error

The error `_ExpoFontLoader.default.getLoadedFonts is not a function` is caused by a version compatibility issue.

## Quick Fix Steps:

1. **Stop the Expo server** (Ctrl+C)

2. **Clear cache and reinstall dependencies:**
```bash
cd frontend
rm -rf node_modules
rm -rf .expo
npm cache clean --force
npm install
```

3. **Install expo-font (if not already installed):**
```bash
npm install expo-font@~11.10.0
```

4. **Restart with cleared cache:**
```bash
npm run start:clear
```

## Alternative Fix (if above doesn't work):

If the error persists, try downgrading @expo/vector-icons:

```bash
cd frontend
npm install @expo/vector-icons@13.0.0
npm run start:clear
```

## If Still Not Working:

Try using React Native's built-in icons instead of @expo/vector-icons temporarily to verify the app works, then we can fix the icon issue.
