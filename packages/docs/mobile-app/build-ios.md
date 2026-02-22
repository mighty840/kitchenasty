# 🍎 Building for iOS

This page walks you through building the iOS app, uploading it to App Store Connect, and getting it published on the Apple App Store.

## 1️⃣ Step 1: Create Your App on App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → the **"+"** button → **"New App"**
3. Fill in the details:
   - 📱 **Platforms**: iOS
   - 🏷️ **Name**: Your restaurant name (e.g., "Mario's Pizza") — this must be unique on the App Store
   - 🌍 **Primary language**: Your default language
   - 🔗 **Bundle ID**: Select the bundle ID matching `ios.bundleIdentifier` in your `app.json` (e.g., `com.mariospizza.app`)
   - 🏷️ **SKU**: A unique identifier you choose (e.g., `mariospizza-ios-1`)
   - 👥 **User Access**: Full Access
4. Click **"Create"**

::: tip 💡 Bundle ID Not Listed?
If your bundle ID doesn't appear in the dropdown, you need to register it first:
1. Go to [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Click the **"+"** button
3. Select **"App IDs"** → **"App"**
4. Enter a description and paste your Bundle ID
5. Enable capabilities: **Push Notifications**, **Associated Domains**
6. Click **"Register"**
:::

## 2️⃣ Step 2: Build the Production Binary

From the `packages/mobile` directory:

```bash
eas build --profile production --platform ios
```

EAS will:
1. 🔑 Ask you to log in with your Apple ID (if not already cached)
2. 🔐 Automatically create or use existing certificates and provisioning profiles
3. 🏗️ Build the app on Expo's Mac build servers
4. ✅ Produce a signed `.ipa` file

The build takes 15-30 minutes. When complete, EAS provides a download URL.

### 🆕 First-Time Build Prompts

On your first iOS build, EAS may ask:

- 🔐 **"Do you want EAS to manage your Apple credentials?"** → Select **Yes** (recommended)
- 👥 **"Select a team"** → Choose your Apple Developer team
- 📜 **"Generate a new Apple Distribution Certificate?"** → Select **Yes**
- 📄 **"Generate a new Apple Provisioning Profile?"** → Select **Yes**

## 3️⃣ Step 3: Upload to App Store Connect

### 🚀 Option A: Automatic Upload with EAS Submit (Recommended)

```bash
eas submit --platform ios --latest
```

EAS will upload the latest build directly to App Store Connect. You'll need:
- 🔑 Your Apple ID
- 🔐 An app-specific password (if you have 2FA enabled):
  1. Go to [appleid.apple.com](https://appleid.apple.com)
  2. Sign in → Security → App-Specific Passwords
  3. Click "Generate Password"
  4. Use this password when EAS prompts for it

### 📤 Option B: Manual Upload with Transporter

1. Download the `.ipa` file from the EAS build URL
2. Install [Transporter](https://apps.apple.com/app/transporter/id1450874784) from the Mac App Store
3. Open Transporter, sign in with your Apple ID
4. Drag and drop the `.ipa` file
5. Click **"Deliver"**

### 🖥️ Option C: Manual Upload with Xcode

1. Download the `.ipa` file
2. Open Xcode → Window → Organizer
3. Click "Distribute App" and follow the prompts

## 4️⃣ Step 4: Configure App Store Listing

In App Store Connect, go to your app and fill in the following:

### 📋 App Information

| Field | What to Enter |
|-------|--------------|
| 🏷️ **Name** | Your restaurant name |
| 📝 **Subtitle** | Short tagline (30 chars max). E.g., "Order Food & Reserve Tables" |
| 🍽️ **Category** | Food & Drink |
| 🏷️ **Secondary Category** | Lifestyle (optional) |
| 📄 **Content Rights** | "This app does not contain third-party content" |
| 🔞 **Age Rating** | Click "Edit" and answer the questionnaire (most answers will be "No") |

### 📱 Version Information

| Field | What to Enter |
|-------|--------------|
| 📸 **Screenshots** | Required for different device sizes (see below) |
| 📄 **Description** | Full app description (see [Store Listings](/mobile-app/store-listings)) |
| 🔍 **Keywords** | Comma-separated search terms (100 chars max). E.g., "food, delivery, pizza, restaurant, order, pickup, reservation" |
| 🔗 **Support URL** | Your restaurant's website or contact page |
| 🌐 **Marketing URL** | (Optional) Your restaurant's website |
| 🔒 **Privacy Policy URL** | Required — URL to your privacy policy page |

### 📸 Screenshots

Apple requires screenshots for each device size you support:

| Device | Size | Required |
|--------|------|----------|
| 📱 iPhone 6.9" (15 Pro Max) | 1320 x 2868 px | Yes (at least one size required) |
| 📱 iPhone 6.7" (14 Pro Max) | 1290 x 2796 px | Yes |
| 📱 iPhone 6.5" (11 Pro Max) | 1284 x 2778 px | Alternative to 6.7" |
| 📱 iPhone 5.5" (8 Plus) | 1242 x 2208 px | Only if supporting older devices |
| 💻 iPad Pro 12.9" | 2048 x 2732 px | Only if `supportsTablet` is true |

You need **minimum 2, maximum 10** screenshots per device size.

::: tip 📸 Taking iOS Screenshots
1. Run the app in the iOS Simulator: `npx expo start --ios`
2. In the Simulator menu: File → Screenshot (or Cmd+S)
3. Use different simulator devices for different sizes:
   - iPhone 15 Pro Max for 6.7" screenshots
   - iPhone SE for 5.5" screenshots
:::

::: tip ✨ Professional Screenshots
For polished app store screenshots with device frames and text overlays, use:
- 🖼️ [Screenshots.pro](https://screenshots.pro) — drag-and-drop screenshot designer
- 📱 [Previewed](https://previewed.app) — mockup generator
- 🎨 [Canva](https://www.canva.com) — search for "App Store Screenshot" templates
:::

### 👤 App Review Information

| Field | What to Enter |
|-------|--------------|
| 👤 **Contact First Name** | Your name |
| 👤 **Contact Last Name** | Your surname |
| 📞 **Contact Phone** | Your phone number |
| 📧 **Contact Email** | Your email |
| 🔑 **Demo Account** | Provide test credentials: `customer@example.com` / `customer123` |
| 📝 **Notes** | "This is a food ordering app for [your restaurant name]. Use the demo account to browse the menu and place a test order." |

::: warning ⚠️ Demo Account Required
Apple's review team will test your app. They need working login credentials and a functioning backend. Make sure your server is running and accessible before submitting.
:::

## 5️⃣ Step 5: Submit for Review

1. In App Store Connect, go to your app's version page
2. Select the uploaded build in the **"Build"** section (it may take a few minutes to appear after upload and processing)
3. Click **"Add for Review"**
4. Review the submission details
5. Click **"Submit to App Review"**

### 👀 Review Process

Apple's review typically takes **24-48 hours** for new apps, though it can occasionally take up to a week.

Common reasons for rejection:
- 📋 **Incomplete information**: Missing privacy policy, screenshots, or description
- 💥 **Bugs**: App crashes or key features don't work
- 🔑 **Login issues**: Review team can't log in with the provided demo account
- 🖥️ **Missing backend**: Server is down or unreachable during review
- 📝 **Placeholder content**: Using "Lorem ipsum" or stock images
- ⚠️ **Guideline 4.2**: If the app is too simple (a "web wrapper"), Apple may reject it. KitchenAsty is a full native app, so this shouldn't be an issue.

If rejected, Apple provides specific feedback. Fix the issues, upload a new build, and resubmit.

## 6️⃣ Step 6: Release

After approval, you have three release options:

1. 🖱️ **Manual release**: You click "Release" when ready
2. ⚡ **Automatic release**: Released immediately after approval
3. 📅 **Scheduled release**: Released on a specific date

Choose your preferred option in the **"Version Release"** section before submitting.

## 7️⃣ Step 7: After Publishing

### 📊 Monitor in App Store Connect

- 📈 **App Analytics**: Downloads, sessions, retention
- ⭐ **Ratings and Reviews**: Respond to customer feedback
- 💥 **Crashes**: Xcode Organizer shows crash logs

### 🧪 TestFlight (For Beta Testing)

Before submitting production releases, you can beta test with TestFlight:

1. Upload a build to App Store Connect
2. Go to the **TestFlight** tab
3. Add internal testers (your Apple Developer team members) — no review needed
4. Add external testers — requires a brief beta review
5. Testers install via the [TestFlight app](https://apps.apple.com/app/testflight/id899247664)

## 🔄 Publishing Updates

When you release a new version:

```bash
# Build new version
eas build --profile production --platform ios

# Submit to App Store Connect
eas submit --platform ios --latest
```

In App Store Connect:
1. Create a new version (e.g., 1.1.0)
2. Select the new build
3. Add "What's New" text describing the changes
4. Submit for review

Updates are usually reviewed faster than initial submissions (often within 24 hours).

## ➡️ Next Step

Continue to **[Store Listings](/mobile-app/store-listings)** for description templates and marketing guidance.
