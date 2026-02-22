# ⚙️ Settings API

All settings endpoints require authentication. Endpoints are grouped by settings category with role-based access control.

## 🎨 Branding (existing)

### `GET /api/settings`
Returns site branding settings (public, no auth required).

### `PUT /api/settings`
Update branding settings. **Auth:** Staff+

### `POST /api/settings/logo`
🖼️ Upload site logo. **Auth:** Staff+

### `POST /api/settings/favicon`
🌐 Upload site favicon. **Auth:** Staff+

---

## 🏢 General Settings

### `GET /api/settings/general`
**Auth:** MANAGER, SUPER_ADMIN

Returns general settings (timezone, currency, contact info).

**Response:**
```json
{
  "success": true,
  "data": {
    "contactEmail": "info@restaurant.com",
    "contactPhone": "+1-555-0123",
    "timezone": "America/New_York",
    "distanceUnit": "mi",
    "defaultCurrency": "USD",
    "currencySymbol": "$",
    "currencyPosition": "before",
    "googleMapsApiKey": "AIza..."
  }
}
```

### `PUT /api/settings/general`
**Auth:** MANAGER, SUPER_ADMIN

Update general settings. All fields are optional.

---

## 📦 Order Settings

### `GET /api/settings/order`
**Auth:** MANAGER, SUPER_ADMIN

### `PUT /api/settings/order`
**Auth:** MANAGER, SUPER_ADMIN

**Body:**
```json
{
  "enabled": true,
  "minOrderDelivery": 15.00,
  "minOrderPickup": 5.00,
  "deliveryLeadTime": 30,
  "pickupLeadTime": 15,
  "enableFutureOrdering": true,
  "enableTipping": true,
  "tipOptions": [10, 15, 20, 25],
  "taxRate": 8.5
}
```

---

## 📅 Reservation Settings

### `GET /api/settings/reservation`
**Auth:** MANAGER, SUPER_ADMIN

### `PUT /api/settings/reservation`
**Auth:** MANAGER, SUPER_ADMIN

**Body:**
```json
{
  "enabled": true,
  "timeInterval": 30,
  "stayTime": 90,
  "maxAdvanceBookingDays": 30,
  "minCancellationNoticeHours": 2,
  "autoConfirm": false
}
```

---

## 📧 Mail Settings

### `GET /api/settings/mail`
**Auth:** SUPER_ADMIN

Returns mail settings with `smtpPass` masked.

### `PUT /api/settings/mail`
**Auth:** SUPER_ADMIN

If `smtpPass` contains `...`, the existing value is preserved.

### `POST /api/settings/mail/test`
**Auth:** SUPER_ADMIN

🧪 Send a test email to verify SMTP configuration.

**Body:**
```json
{
  "to": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

---

## 💳 Payment Settings

### `GET /api/settings/payment`
**Auth:** SUPER_ADMIN

Returns payment gateway settings. `stripeSecretKey`, `stripeWebhookSecret`, and `paypalClientSecret` are masked.

### `PUT /api/settings/payment`
**Auth:** SUPER_ADMIN

Masked secret values (containing `...`) are preserved on save.

**Body:**
```json
{
  "stripeEnabled": true,
  "stripePublishableKey": "pk_test_...",
  "stripeSecretKey": "sk_t...xH4f",
  "stripeWebhookSecret": "whse...ab12",
  "paypalEnabled": false,
  "paypalClientId": "",
  "paypalClientSecret": "",
  "paypalSandbox": true,
  "cashEnabled": true
}
```

---

## ⭐ Review Settings

### `GET /api/settings/review`
**Auth:** MANAGER, SUPER_ADMIN

### `PUT /api/settings/review`
**Auth:** MANAGER, SUPER_ADMIN

**Body:**
```json
{
  "enabled": true,
  "requireOrder": true,
  "autoApprove": false,
  "minimumRating": 1
}
```

---

## 🔧 Advanced Settings

### `GET /api/settings/advanced`
**Auth:** SUPER_ADMIN

### `PUT /api/settings/advanced`
**Auth:** SUPER_ADMIN

**Body:**
```json
{
  "maintenanceMode": false,
  "maintenanceMessage": "We'll be back soon!",
  "enableRateLimiting": true
}
```
