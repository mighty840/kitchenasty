# ⚙️ App Configuration

Before building the app, you need to customize it with your restaurant's branding, your server's URL, and your payment keys.

## 1️⃣ Step 1: Install Dependencies

On your development computer, clone the repository and install dependencies:

```bash
git clone https://github.com/kitchenasty/kitchenasty.git
cd kitchenasty
npm install
```

## 2️⃣ Step 2: Configure `app.json`

Open `packages/mobile/app.json` in a text editor. This is the main configuration file for the Expo app.

```json
{
  "expo": {
    "name": "Your Restaurant Name",
    "slug": "your-restaurant",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "your-restaurant",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#F97316"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourrestaurant.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F97316"
      },
      "package": "com.yourrestaurant.app"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#F97316"
        }
      ]
    ],
    "extra": {
      "apiBaseUrl": "https://api.yourdomain.com",
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

### 📝 Fields to Customize

| Field | What to Change | Example |
|-------|---------------|---------|
| 🏷️ `name` | Your restaurant's name (shown under the app icon) | `"Mario's Pizza"` |
| 🔗 `slug` | URL-friendly version of the name (lowercase, no spaces) | `"marios-pizza"` |
| 🔢 `version` | App version (increment with each release) | `"1.0.0"` |
| 📲 `scheme` | Deep link scheme (lowercase, no spaces) | `"mariospizza"` |
| 🎨 `splash.backgroundColor` | Splash screen background color (hex) | `"#E53E3E"` |
| 🍎 `ios.bundleIdentifier` | Unique iOS app identifier | `"com.mariospizza.app"` |
| 🤖 `android.package` | Unique Android app identifier | `"com.mariospizza.app"` |
| 🌐 `extra.apiBaseUrl` | Your KitchenAsty API server URL (with https) | `"https://api.mariospizza.com"` |
| 🏗️ `extra.eas.projectId` | Your EAS project ID (set up later) | — |

::: warning ⚠️ Bundle Identifier
The `bundleIdentifier` (iOS) and `package` (Android) are permanent identifiers for your app on the app stores. They **cannot be changed** after publishing. Use a reverse domain format: `com.yourcompany.appname`.
:::

## 3️⃣ Step 3: Replace App Icons and Splash Screen

Replace the placeholder images in `packages/mobile/assets/`:

### 🖼️ Required Images

| File | Size | Purpose |
|------|------|---------|
| 📱 `icon.png` | 1024 x 1024 px | App icon (iOS and Android) |
| 🌅 `splash.png` | 1284 x 2778 px | Splash screen shown while app loads |
| 🤖 `adaptive-icon.png` | 1024 x 1024 px | Android adaptive icon foreground (use padding — the OS adds a mask) |

### 🎨 Design Tips

- 📱 **Icon**: Use a simple, bold design. No text needed — the app name appears below the icon. Use your restaurant's logo or a distinctive symbol.
- 🌅 **Splash screen**: Keep it simple — your logo centered on a solid color background works best.
- 🤖 **Adaptive icon**: Android crops this image into different shapes (circle, squircle, etc.), so keep the logo in the center 66% of the image with padding around the edges.

### 🛠️ Free Tools for Creating Icons

- 🎨 [Canva](https://www.canva.com) — use the "App Icon" template (1024x1024)
- ✏️ [Figma](https://www.figma.com) — free design tool
- 🍳 [Icon Kitchen](https://icon.kitchen) — generates adaptive icons from your image
- 📱 [App Icon Generator](https://www.appicon.co) — generates all required sizes

## 4️⃣ Step 4: Customize Brand Colors

The app uses a brand color throughout the UI. To change it from the default orange:

Edit `packages/mobile/tailwind.config.js`:

```js
module.exports = {
  // ...
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#FFF7ED',  // lightest
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',  // ← main brand color
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',  // darkest
        },
      },
    },
  },
};
```

Replace the hex values with your brand color palette. You can generate a full palette from a single color using [UI Colors](https://uicolors.app).

## 5️⃣ Step 5: Configure Stripe (Optional)

If you accept credit card payments through Stripe:

1. 🔑 Get your **publishable key** from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. 🖥️ The server-side secret key is already configured in your server's `.env` file
3. 📱 The mobile app uses the Stripe React Native SDK which is initialized with your publishable key

Add your Stripe publishable key to `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://api.yourdomain.com",
      "stripePublishableKey": "pk_live_..."
    }
  }
}
```

## 6️⃣ Step 6: Configure Social Login (Optional)

If you want Google or Facebook sign-in:

### 🔵 Google Sign-In

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials for **iOS** and **Android** separately
3. For iOS: set the bundle ID to match `ios.bundleIdentifier`
4. For Android: set the package name to match `android.package` and provide the SHA-1 fingerprint (see [EAS Build](/mobile-app/eas-build) for how to get this)

### 🔷 Facebook Login

1. Go to [Facebook Developer Portal](https://developers.facebook.com)
2. Add the iOS and Android platforms to your app
3. For iOS: set the bundle ID
4. For Android: set the package name and key hash

## ✅ Summary Checklist

- [ ] ⚙️ `app.json` updated with your restaurant name, identifiers, and API URL
- [ ] 🖼️ App icon (1024x1024), splash screen, and adaptive icon replaced
- [ ] 🎨 Brand colors customized in `tailwind.config.js`
- [ ] 💳 Stripe publishable key added (if using Stripe)
- [ ] 🔑 Social login configured (if using Google/Facebook)

## ➡️ Next Step

Continue to **[Local Development](/mobile-app/local-development)** to test the app on your phone.
