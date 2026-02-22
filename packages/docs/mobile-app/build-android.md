# 🤖 Building for Android

This page walks you through building the Android app, uploading it to Google Play, and getting it published.

## 1️⃣ Step 1: Create Your App on Google Play Console

1. Log in to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in the details:
   - 🏷️ **App name**: Your restaurant name (e.g., "Mario's Pizza")
   - 🌍 **Default language**: Your primary language
   - 📱 **App or Game**: App
   - 🆓 **Free or Paid**: Free (the app is free; customers pay for food, not the app)
4. Check the declarations checkboxes
5. Click **"Create app"**

## 2️⃣ Step 2: Build the Production Binary

From the `packages/mobile` directory:

```bash
eas build --profile production --platform android
```

This builds an **Android App Bundle (AAB)** — the format Google Play requires.

The build takes 10-20 minutes. When complete, EAS provides:
- 🔗 A URL to download the `.aab` file
- 📊 The build appears in your [Expo Dashboard](https://expo.dev)

## 3️⃣ Step 3: Upload to Google Play

### 🚀 Option A: Automatic Upload with EAS Submit (Recommended)

If you configured the Google Play service account in [EAS Build Setup](/mobile-app/eas-build):

```bash
eas submit --platform android --latest
```

EAS will upload the latest build directly to Google Play's internal testing track.

### 📤 Option B: Manual Upload

1. Download the `.aab` file from the EAS build URL
2. In Google Play Console, go to your app → **Testing** → **Internal testing**
3. Click **"Create new release"**
4. Click **"Upload"** and select the `.aab` file
5. Add release notes (e.g., "Initial release")
6. Click **"Save"** then **"Review release"** then **"Start rollout"**

## 4️⃣ Step 4: Set Up App Signing

Google Play manages the app signing key for you (Play App Signing). This is enabled by default for new apps.

When you upload your first AAB, Google Play Console will show:
- 🔐 **App signing key**: Managed by Google (most secure option)
- 🔑 **Upload key**: The key EAS used to sign the build

::: tip 💡
If prompted to opt in to Play App Signing, **always opt in**. It means Google securely stores the final signing key, and you only need the upload key (which can be reset if lost).
:::

## 5️⃣ Step 5: Complete the Store Listing

Before you can publish, Google requires certain information. Navigate through the left sidebar:

### 🏪 Main store listing

| Field | What to Enter |
|-------|--------------|
| 🏷️ **App name** | Your restaurant name |
| 📝 **Short description** | 80 chars max. E.g., "Order food for delivery or pickup from Mario's Pizza" |
| 📄 **Full description** | Detailed description (see [Store Listings](/mobile-app/store-listings) for templates) |

### 🖼️ Graphics

| Asset | Required Size | Notes |
|-------|--------------|-------|
| 📱 App icon | 512 x 512 px | High-res version of your app icon |
| 🖼️ Feature graphic | 1024 x 500 px | Banner shown at the top of your listing |
| 📸 Phone screenshots | Min 2, max 8 | At least 2 screenshots from the app |
| 📱 7-inch tablet screenshots | Optional | If `supportsTablet` is enabled |
| 💻 10-inch tablet screenshots | Optional | If `supportsTablet` is enabled |

::: tip 📸 Taking Screenshots
The easiest way to take screenshots is from the Android Emulator:
1. Run the app in the emulator: `npx expo start --android`
2. Navigate to the screen you want to capture
3. Click the camera icon in the emulator toolbar
4. Screenshots are saved to your desktop
:::

### 🏷️ Content rating

1. Go to **Policy** → **App content** → **Content rating**
2. Click **"Start questionnaire"**
3. Select **"Utility, Productivity, Communication, or Other"** as the category
4. Answer the questions honestly (a restaurant app will likely receive an "Everyone" rating)
5. Submit the questionnaire

### 🔒 Privacy policy

Google requires a privacy policy URL. Create a simple privacy policy page on your website that covers:
- 📋 What data you collect (email, name, phone, order history)
- 🎯 How you use it (processing orders, sending notifications)
- 🗑️ How customers can request data deletion

Enter the URL in the **Privacy policy** field.

### 👥 Target audience

1. Go to **Policy** → **App content** → **Target audience and content**
2. Select the appropriate age groups (typically 18+ for a food ordering app)
3. Confirm the app is not designed for children

### 🛡️ Data safety

1. Go to **Policy** → **App content** → **Data safety**
2. Answer the questionnaire about data collection:
   - 👤 **Account info**: Yes (email, name, phone)
   - 📍 **Location**: No (unless you add location features)
   - 💳 **Financial info**: Only if using Stripe (payment processed by Stripe, not stored by your app)
   - 📱 **App activity**: Yes (order history)
3. Submit

## 6️⃣ Step 6: Internal Testing

Before going to production, test with internal testers:

1. Go to **Testing** → **Internal testing**
2. Click **"Testers"** tab → **"Create email list"**
3. Add tester email addresses (your own, staff members)
4. Testers will receive an email with a link to install the app

Verify:
- [ ] ✅ App installs successfully
- [ ] 🔑 Login/register works
- [ ] 🍔 Menu loads
- [ ] 📦 Ordering flow completes
- [ ] 🔔 Push notifications arrive (if configured)

## 7️⃣ Step 7: Promote to Production

Once testing is complete:

1. Go to **Testing** → **Internal testing**
2. Click **"Promote release"** → **"Production"**
3. Add release notes
4. Click **"Start rollout to Production"**

### 👀 Review Process

Google reviews new apps, which typically takes **a few hours to 7 days**. They check for:
- ✅ Policy compliance
- ⚙️ App functionality
- 📋 Content accuracy

If rejected, Google provides specific reasons and you can resubmit after fixing the issues.

## 8️⃣ Step 8: Monitor

After publishing, monitor your app in Google Play Console:

- 📊 **Statistics** — downloads, active users, ratings
- ⭐ **Ratings and reviews** — respond to customer feedback
- 💥 **Crashes and ANRs** — Android vitals show stability issues
- 🧪 **Pre-launch report** — Google automatically tests your app on real devices

## 🔄 Publishing Updates

When you release a new version of KitchenAsty:

```bash
# Build new version
eas build --profile production --platform android

# Submit to Google Play
eas submit --platform android --latest
```

The update goes through the same review process (usually faster for updates).

## ➡️ Next Step

Continue to **[Building for iOS](/mobile-app/build-ios)** or skip to **[Store Listings](/mobile-app/store-listings)** for description templates and screenshot guidance.
