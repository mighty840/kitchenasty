# 🏗️ EAS Build Setup

[Expo Application Services (EAS)](https://expo.dev/eas) provides cloud-based builds for your mobile app. This means you can build Android and iOS binaries without installing Android Studio or Xcode locally. EAS also manages code signing (certificates and provisioning profiles).

## 1️⃣ Step 1: Install EAS CLI

If you haven't already:

```bash
npm install -g eas-cli
```

## 2️⃣ Step 2: Log In to Expo

```bash
eas login
```

Enter your Expo account credentials.

## 3️⃣ Step 3: Link the Project

Navigate to the mobile app directory and initialize the EAS project:

```bash
cd packages/mobile
eas init
```

This creates a project on Expo's servers and adds a `projectId` to your `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

## 4️⃣ Step 4: Create `eas.json`

Create the EAS build configuration file at `packages/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "image": "latest"
      },
      "android": {
        "image": "latest",
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 📋 Build Profiles Explained

| Profile | Purpose | Output |
|---------|---------|--------|
| 🧪 `development` | Testing with full native modules | Dev client for simulators/devices |
| 👀 `preview` | Share test builds with your team | Installable APK/IPA |
| 🚀 `production` | App Store / Play Store submission | Optimized, signed binary |

## 5️⃣ Step 5: Configure iOS Credentials

EAS can manage your Apple certificates automatically:

```bash
eas credentials --platform ios
```

Select **"Let EAS manage my credentials"** (recommended). EAS will:
- 🔐 Create a distribution certificate
- 📄 Create a provisioning profile
- 🔒 Store them securely on Expo's servers

You'll be prompted to sign in with your Apple ID. Use the account enrolled in the Apple Developer Program.

::: tip 💡
If you prefer to manage credentials yourself, select "I want to provide my own credentials" and upload your `.p12` certificate and `.mobileprovision` file.
:::

## 6️⃣ Step 6: Configure Android Credentials

EAS can also manage Android signing keys:

```bash
eas credentials --platform android
```

Select **"Let EAS manage my credentials"**. EAS will generate:
- 🔑 An upload keystore (for signing the APK/AAB)
- 🏷️ A key alias and passwords

::: danger 🚨 Keep Your Keystore Safe
The Android upload keystore is **permanent**. If you lose it, you can never update your app on Google Play. EAS stores it securely, but you should also download a backup:

```bash
eas credentials --platform android
# Select "Download credentials"
```

Save the downloaded `.jks` file and passwords in a secure location (password manager, encrypted drive).
:::

## 7️⃣ Step 7: Set Up Google Play Service Account

To enable automatic submission to Google Play, create a service account:

1. 🌐 **Open Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)

2. 📁 **Create or select a project** associated with your Play Console

3. 🔌 **Enable the Google Play Android Developer API**:
   - Go to APIs & Services → Library
   - Search for "Google Play Android Developer API"
   - Click Enable

4. 👤 **Create a service account**:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "Service Account"
   - Name: `eas-build-submit`
   - Role: none needed at this step
   - Click "Done"

5. 🔑 **Generate a JSON key**:
   - Click on the service account you just created
   - Go to the "Keys" tab
   - Click "Add Key" → "Create new key" → "JSON"
   - Download the JSON file

6. 🔓 **Grant Play Console access**:
   - Go to [play.google.com/console](https://play.google.com/console)
   - Settings → Developer account → API access
   - Click "Link" next to the Google Cloud project
   - Find the service account and click "Grant access"
   - Grant these permissions:
     - ✅ Release to production, exclude devices, and use Play App Signing
     - ✅ Release apps to testing tracks
     - ✅ Manage testing tracks and edit tester lists

7. 💾 **Save the JSON key**:
   - Place the downloaded JSON file at `packages/mobile/google-play-service-account.json`
   - **Add it to `.gitignore`** — never commit this file to version control

```bash
echo "google-play-service-account.json" >> packages/mobile/.gitignore
```

## 8️⃣ Step 8: Test a Build

Run a test build to verify everything is configured correctly:

```bash
# Android test build
eas build --profile preview --platform android

# iOS test build
eas build --profile preview --platform ios
```

EAS will:
1. ☁️ Upload your project to Expo's build servers
2. 📦 Install dependencies
3. 🔨 Build the native app
4. 🔐 Sign it with your credentials
5. 🔗 Provide a download link

The first build takes 10-20 minutes. Subsequent builds are faster due to caching.

## 💰 EAS Build Pricing

| Plan | Builds per Month | Build Priority |
|------|-----------------|----------------|
| 🆓 Free | 30 | Standard queue |
| 🚀 Production ($99/month) | Unlimited | Priority queue |

The free tier is sufficient for most restaurants. You only need builds when publishing updates.

## ➡️ Next Step

Continue to **[Building for Android](/mobile-app/build-android)** or **[Building for iOS](/mobile-app/build-ios)**.
