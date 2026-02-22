# 🔔 Push Notifications

Push notifications alert customers when their order status changes (e.g., "Your order is being prepared", "Your order is ready for pickup"). KitchenAsty uses [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/), which handles both iOS (APNs) and Android (FCM) through a unified API.

## 🔄 How It Works

```
KitchenAsty Server → Expo Push Service → APNs (iOS) / FCM (Android) → Customer's Phone
```

1. 📱 When a customer opens the app, it registers for push notifications and sends the **Expo Push Token** to your server
2. 📤 When an order status changes, your server sends a push notification via the Expo Push API
3. 🔀 Expo routes the notification to Apple (APNs) or Google (FCM)
4. 🔔 The customer sees the notification on their phone

## 🤖 Android Setup (FCM)

Android push notifications work through Firebase Cloud Messaging (FCM).

### 1️⃣ Step 1: Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Create a project"** (or use an existing one)
3. Enter your project name (e.g., "KitchenAsty")
4. Disable Google Analytics (optional, not needed for push)
5. Click **"Create project"**

### 2️⃣ Step 2: Add an Android App to Firebase

1. In the Firebase Console, click the **Android icon** to add an app
2. Enter your **Android package name**: Must match `android.package` in `app.json` (e.g., `com.mariospizza.app`)
3. Enter an **App nickname**: Your restaurant name
4. 🔑 **SHA-1 certificate fingerprint**: Get it from EAS:
   ```bash
   eas credentials --platform android
   # Look for the SHA-1 fingerprint
   ```
5. Click **"Register app"**
6. 📥 Download the `google-services.json` file
7. Place it at `packages/mobile/google-services.json`

### 3️⃣ Step 3: Get the FCM Server Key

1. In Firebase Console, go to **Project Settings** → **Cloud Messaging** tab
2. If "Cloud Messaging API (V1)" is enabled, you're set (Expo uses FCM v1)
3. If you see "Cloud Messaging API (Legacy)" is disabled, click the three dots and enable it

### 4️⃣ Step 4: Upload FCM Credentials to Expo

```bash
eas credentials --platform android
```

Select **"Push Notifications: Manage your FCM API key"** and follow the prompts to upload your Firebase service account key.

Alternatively, upload via the Expo website:
1. 🌐 Go to [expo.dev](https://expo.dev) → Your project → Credentials
2. 🤖 Select Android → Push Notifications
3. 📤 Upload the FCM server key or service account JSON

### 5️⃣ Step 5: Add to app.json

Add the Firebase config to your `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

## 🍎 iOS Setup (APNs)

iOS push notifications work through Apple Push Notification service (APNs).

### 1️⃣ Step 1: Enable Push Notification Capability

If you haven't already when creating the App ID:

1. Go to [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Click your app's identifier
3. Check **"Push Notifications"**
4. Click **"Save"**

### 2️⃣ Step 2: Create an APNs Key

1. Go to [developer.apple.com/account/resources/authkeys](https://developer.apple.com/account/resources/authkeys/list)
2. Click the **"+"** button to create a new key
3. Enter a name: "KitchenAsty Push Key"
4. Check **"Apple Push Notifications service (APNs)"**
5. Click **"Continue"** then **"Register"**
6. 📥 **Download the `.p8` key file** — you can only download it once!
7. 📝 Note the **Key ID** shown on the page
8. 📝 Note your **Team ID** (shown at the top right of the developer portal, or in Membership → Team ID)

::: danger 🚨 Save Your APNs Key
The `.p8` key file can only be downloaded once. Store it securely (password manager, encrypted backup). If you lose it, you'll need to create a new key.
:::

### 3️⃣ Step 3: Upload APNs Key to Expo

```bash
eas credentials --platform ios
```

Select **"Push Notifications: Manage your Apple Push Notifications Key"** and provide:
- 🔑 The `.p8` key file
- 🏷️ The Key ID
- 👥 Your Apple Team ID

Alternatively, upload via the Expo website:
1. 🌐 Go to [expo.dev](https://expo.dev) → Your project → Credentials
2. 🍎 Select iOS → Push Notifications
3. 📤 Upload the `.p8` file, Key ID, and Team ID

## 🖥️ Server Configuration

The KitchenAsty server already includes push notification support via `expo-server-sdk`. The server automatically:

1. 💾 Stores the customer's Expo Push Token when they log in (via `POST /api/auth/push-token`)
2. 📤 Sends push notifications when order status changes (in `packages/server/src/lib/socket.ts`)

No additional server configuration is needed.

## 🧪 Testing Push Notifications

### 🔧 Using Expo's Push Tool

1. 📱 Open the app on a real device (push notifications don't work in simulators)
2. 🔑 Log in — the app registers for push and sends the token to your server
3. 🌐 Go to [expo.dev/notifications](https://expo.dev/notifications)
4. 📝 Enter the Expo Push Token (find it in your server logs or database)
5. ✍️ Enter a title and body
6. 📤 Click **"Send a Notification"**

### 📦 Testing via Order Status Change

1. 🛒 Place an order through the app
2. 🔄 In the Admin Dashboard, change the order status (e.g., from "Pending" to "Preparing")
3. 🔔 The customer should receive a push notification on their phone

## 📋 Notification Content

KitchenAsty sends these notifications:

| Order Status | Notification Title | Body |
|-------------|-------------------|------|
| ✅ CONFIRMED | Order Confirmed | Your order #KA-XXX has been confirmed |
| 🍳 PREPARING | Being Prepared | Your order #KA-XXX is being prepared |
| ✅ READY | Ready! | Your order #KA-XXX is ready for pickup |
| 🚚 OUT_FOR_DELIVERY | On Its Way | Your order #KA-XXX is out for delivery |
| 📦 DELIVERED | Delivered | Your order #KA-XXX has been delivered. Enjoy! |

## 🔧 Troubleshooting

### ❌ Notifications Not Arriving

1. 🔐 **Check permissions**: Make sure the user granted notification permissions on their device
2. 🔑 **Check the token**: Verify the Expo Push Token is saved in the database (`Customer.expoPushToken` field)
3. 🧪 **Test with Expo's tool**: Use [expo.dev/notifications](https://expo.dev/notifications) to send a test notification directly
4. 📋 **Check server logs**: Look for push notification errors in `docker compose logs server`
5. 📱 **Physical device required**: Push notifications do not work in iOS Simulator or Android Emulator

### 🍎 iOS Notifications Not Working in Production

- ✅ Ensure the APNs key is uploaded to Expo
- ✅ Ensure Push Notifications capability is enabled on the App ID
- ✅ Ensure the provisioning profile includes push notification entitlement
- 🔨 Rebuild the app after making credential changes

### 🤖 Android Notifications Not Working

- ✅ Ensure `google-services.json` is in the correct location
- ✅ Ensure the FCM key is uploaded to Expo
- 🔨 Ensure the app was rebuilt after adding `google-services.json`

## ➡️ Next Step

Continue to **[Updates & Maintenance](/mobile-app/updates)** to learn how to publish app updates.
