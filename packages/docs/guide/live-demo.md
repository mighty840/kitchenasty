# Live Demo

A live demo of KitchenAsty is available at:

| | URL |
|---|---|
| **Storefront** | [demo.kitchenasty.com](https://demo.kitchenasty.com) |
| **Admin Panel** | [demo.kitchenasty.com/admin](https://demo.kitchenasty.com/admin/) |

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@kitchenasty.com` | `admin123` |
| Customer | `customer@example.com` | `customer123` |

## Limitations

- **Data resets every 2 hours.** Any changes you make (orders, menu edits, settings) will be reverted automatically. This keeps the demo clean for everyone.
- **Rate limited.** Requests are limited to 10 per second per IP address to prevent abuse. If you hit the limit you'll receive a `429 Too Many Requests` response.
- **No real payments.** Stripe and PayPal are not configured on the demo instance. Use cash-on-delivery to test the full order flow.
- **No email delivery.** SMTP is not configured, so email notifications (order confirmations, staff invites) won't be sent.

## What to Try

1. **Browse the storefront** — view locations, menus, and place an order as a guest or logged-in customer
2. **Manage orders** — open the admin panel and watch orders appear in real-time on the Kitchen Display
3. **Edit the menu** — add categories, items, options, and allergens from the admin
4. **Make a reservation** — book a table from the storefront and confirm it from the admin
5. **Customize the site** — change branding, colors, and landing page content from Design settings
6. **Explore analytics** — check the dashboard for revenue charts, order stats, and top-selling items
