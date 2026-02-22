# 🔗 Social Login

KitchenAsty supports customer login via **Google** and **Facebook** using Passport.js OAuth strategies.

## 🟢 Google OAuth

### 1. 🔧 Create credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project or select an existing one
3. Navigate to **APIs & Services → Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`

### 2. ⚙️ Configure environment

```dotenv
BASE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 3. 🚀 Usage

Direct customers to:

```
GET /api/auth/google
```

After authenticating with Google, the user is redirected to the callback URL and receives a JWT token.

## 🔵 Facebook Login

### 1. 🔧 Create an app

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app and select **Consumer** type
3. Add the **Facebook Login** product
4. In Settings → Basic, note your App ID and App Secret
5. Add valid OAuth redirect URI: `http://localhost:3000/api/auth/facebook/callback`

### 2. ⚙️ Configure environment

```dotenv
BASE_URL=http://localhost:3000
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
```

### 3. 🚀 Usage

Direct customers to:

```
GET /api/auth/facebook
```

## 🔄 How It Works

1. Customer clicks "Login with Google/Facebook"
2. Browser redirects to the OAuth provider
3. After approval, the provider redirects to `BASE_URL/api/auth/{provider}/callback`
4. Passport.js extracts the profile and creates or updates a Customer record
5. A JWT token is generated and returned via the `handleSocialCallback` controller
6. The customer is logged in with their social account

::: tip
Social login routes are only registered when the corresponding environment variables are set. If `GOOGLE_CLIENT_ID` is not set, the `/api/auth/google` route will not exist.
:::
