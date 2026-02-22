# 🔄 Updates & Maintenance

After your app is live on the stores, you'll need to publish updates periodically — bug fixes, new features, or menu changes. This page explains the different update strategies and how to use them.

## 📋 Update Types

There are two ways to update your app:

| Method | What Changes | Review Required | Speed |
|--------|-------------|-----------------|-------|
| 🏗️ **Full build** (EAS Build) | Native code, dependencies, app config | Yes (store review) | 1-7 days |
| ⚡ **OTA update** (EAS Update) | JavaScript code, assets | No | Instant |

### 🤔 When to Use Each

**Full build** (store update):
- 📦 Adding or updating native dependencies
- ⚙️ Changing `app.json` configuration
- ⬆️ Updating the Expo SDK version
- 🔧 Adding new native modules

**OTA update** (over-the-air):
- 🐛 Bug fixes in JavaScript code
- 🎨 UI changes (colors, layouts, text)
- 📱 New screens or features (JS-only)
- 🌍 Translation updates
- 🔗 Updating the API base URL

## ⚡ OTA Updates with EAS Update

Over-the-air updates let you push changes to users instantly without going through app store review. When users open the app, it downloads the latest JavaScript bundle in the background.

### 🔧 Setup

```bash
# Install expo-updates
cd packages/mobile
npx expo install expo-updates

# Configure EAS Update
eas update:configure
```

This adds the required configuration to `app.json`.

### 🚀 Publishing an OTA Update

After making changes to JavaScript code:

```bash
# Publish an update to the production channel
eas update --branch production --message "Fix checkout button alignment"
```

The update is available to users immediately. The next time they open the app, it downloads in the background and applies on the following launch.

### 📡 Update Channels

| Channel | Purpose |
|---------|---------|
| 🚀 `production` | Live app on the stores |
| 👀 `preview` | Internal testing builds |
| 🧪 `development` | Development builds |

### ⏪ Rollback

If an OTA update introduces a bug:

```bash
# List recent updates
eas update:list

# Roll back by republishing the previous good version
eas update --branch production --message "Rollback: revert checkout fix"
```

## 🏗️ Full Store Updates

For changes that require a new native build:

### 🤖 Android

```bash
# Build
eas build --profile production --platform android

# Submit to Google Play
eas submit --platform android --latest
```

In Google Play Console, the new version appears in your releases. Add release notes and roll it out.

### 🍎 iOS

```bash
# Build
eas build --profile production --platform ios

# Submit to App Store Connect
eas submit --platform ios --latest
```

In App Store Connect:
1. 🔢 Create a new version (increment the version number)
2. 📦 Select the new build
3. 📝 Fill in "What's New in This Version"
4. 📤 Submit for review

## 🔢 Version Numbering

Follow [semantic versioning](https://semver.org/):

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| 🐛 Bug fixes | Patch | 1.0.0 → 1.0.1 |
| ✨ New features | Minor | 1.0.1 → 1.1.0 |
| 💥 Breaking changes | Major | 1.1.0 → 2.0.0 |

Update the version in `packages/mobile/app.json`:

```json
{
  "expo": {
    "version": "1.1.0"
  }
}
```

The `buildNumber` (iOS) and `versionCode` (Android) are auto-incremented by EAS when you have `"autoIncrement": true` in `eas.json`.

## 📊 Monitoring App Health

### 💥 Crash Reporting

After publishing, monitor for crashes:

- 🤖 **Google Play Console** → Android Vitals → Crashes & ANRs
- 🍎 **App Store Connect** → App Analytics → Metrics → Crashes
- 📦 **Expo Dashboard** → Your project → Updates (shows update adoption)

### 💬 User Feedback

- ⭐ Respond to app store reviews promptly (see [Store Listings](/mobile-app/store-listings))
- 📧 Add an in-app feedback mechanism (email link in the Account tab)

## 📦 Keeping Dependencies Updated

Periodically update Expo SDK and dependencies:

```bash
# Check for Expo SDK updates
npx expo install --check

# Update to latest compatible versions
npx expo install --fix
```

Major Expo SDK upgrades (e.g., SDK 52 → 53) should be tested thoroughly:

1. 📖 Read the [Expo changelog](https://expo.dev/changelog) for breaking changes
2. 🧪 Update locally and test all app flows
3. 👀 Build a preview version for testing
4. 🚀 Submit to stores after verification

## 🤖 Automating Builds with GitHub Actions

You can automate builds when you push to `main`:

Create `.github/workflows/mobile-build.yml`:

```yaml
name: Mobile Build

on:
  push:
    branches: [main]
    paths:
      - 'packages/mobile/**'
      - 'packages/shared/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - run: npm ci

      - name: Build Android
        run: cd packages/mobile && eas build --profile production --platform android --non-interactive

      - name: Build iOS
        run: cd packages/mobile && eas build --profile production --platform ios --non-interactive
```

Add your `EXPO_TOKEN` to GitHub repository secrets:
1. 🔑 Get your token: `eas login` then go to [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
2. ⚙️ Add it to GitHub: Repository → Settings → Secrets → New repository secret

## ✅ Checklist for Each Update

- [ ] 🧪 Make and test changes locally
- [ ] 🤔 Determine if this is an OTA update or full build
- [ ] ⚡ For OTA: `eas update --branch production --message "description"`
- [ ] 🏗️ For full build: `eas build` then `eas submit` for each platform
- [ ] 🔢 Update version number in `app.json` for store updates
- [ ] 📝 Write release notes / "What's New"
- [ ] 📊 Monitor crash reports after release
- [ ] ⭐ Respond to any new reviews
