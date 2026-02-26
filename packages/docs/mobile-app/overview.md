# 📱 Mobile App Overview

KitchenAsty includes a customer-facing mobile app built with [Expo](https://expo.dev) (React Native). This guide walks you through everything needed to build the app and publish it to the Apple App Store and Google Play Store.

## 🎯 What the Mobile App Does

The mobile app gives your customers a native experience on their phones:

- 🍔 Browse your menu with categories and search
- 🛒 Add items to cart with customizations (sizes, toppings, etc.)
- 📦 Place orders for delivery or pickup
- 💳 Pay with Stripe, PayPal, or cash
- 📍 Track order status in real-time
- 📅 Make table reservations
- 🔔 Receive push notifications when their order is ready
- 📜 View order history
- 🔑 Sign in with email or social login (Google, Facebook)
- 🌍 Switch between 6 languages

### App Screenshots

| Home | Menu | Item Detail |
|------|------|-------------|
| ![Mobile Home](/screenshots/mobile-home.png) | ![Mobile Menu](/screenshots/mobile-menu.png) | ![Mobile Menu Item](/screenshots/mobile-menu-item.png) |

| Login | Locations |
|-------|-----------|
| ![Mobile Login](/screenshots/mobile-login.png) | ![Mobile Locations](/screenshots/mobile-locations.png) |

## 📋 Prerequisites

Before starting, you need:

- 🖥️ Your KitchenAsty server running and accessible via HTTPS (see [Self-Hosting Guide](/self-hosting/overview))
- 💻 A computer (Mac, Windows, or Linux) for development
- 🟢 Node.js 22 or later installed
- 🔧 Basic familiarity with running terminal commands

::: warning 🍎 Mac Required for iOS
To build the iOS app for the App Store, you need a Mac computer (or access to one). Android builds can be done from any operating system. Alternatively, you can use Expo's cloud build service (EAS Build) to build for both platforms without a Mac.
:::

## 📖 Guide Structure

Follow these pages in order:

1. 🏢 **[Developer Accounts](/mobile-app/developer-accounts)** — Register for Apple and Google developer programs
2. ⚙️ **[App Configuration](/mobile-app/app-configuration)** — Customize the app with your branding, API URL, and keys
3. 🧪 **[Local Development](/mobile-app/local-development)** — Run the app locally for testing
4. 🏗️ **[EAS Build Setup](/mobile-app/eas-build)** — Configure Expo Application Services for cloud builds
5. 🤖 **[Building for Android](/mobile-app/build-android)** — Build, sign, and upload to Google Play
6. 🍎 **[Building for iOS](/mobile-app/build-ios)** — Build, sign, and upload to the App Store
7. 🏪 **[Store Listings](/mobile-app/store-listings)** — Write descriptions, prepare screenshots, and submit for review
8. 🔔 **[Push Notifications](/mobile-app/push-notifications)** — Set up push notification credentials
9. 🔄 **[Updates & Maintenance](/mobile-app/updates)** — Publish updates after the app is live

## 💰 Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| 🍎 Apple Developer Program | $99 USD | Annual |
| 🤖 Google Play Developer Account | $25 USD | One-time |
| 🏗️ EAS Build (Expo) | Free tier: 30 builds/month | — |
| 📦 Expo account | Free | — |

Total first-year cost: approximately **$124 USD**.
