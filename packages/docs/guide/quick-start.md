# ⚡ Quick Start

After [installing KitchenAsty](/guide/installation-docker), follow this walkthrough to explore the platform.

## 🛒 Place Your First Order

1. Open the **Storefront** at http://localhost:5174
2. Select a location
3. Browse the menu and add items to the cart
4. Choose **Delivery** or **Pickup**
5. Complete checkout as a guest or register an account
6. Choose a payment method (cash for quickest testing)

![Storefront Menu](/screenshots/storefront-menu.png)

## 📋 Manage Orders in Admin

1. Open the **Admin Dashboard** at http://localhost:5173
2. Log in with `admin@kitchenasty.com` / `admin123`
3. Navigate to **Orders** to see the order you just placed
4. Update the order status: Pending → Confirmed → Preparing → Ready → Delivered/Picked Up

![Admin Orders](/screenshots/admin-orders.png)

## 🍔 Create a Menu Item

1. In the Admin Dashboard, go to **Menu → Items**
2. Click **Add Item**
3. Fill in the name, price, description, and select a category
4. Add menu options (e.g., size with Small/Medium/Large)
5. Upload an image
6. Save — the item appears on the storefront immediately

## 📍 Set Up a Location

1. Go to **Locations** in the admin
2. Click **Add Location**
3. Fill in the name, address, and contact info
4. Set **Operating Hours** for each day of the week
5. Create **Delivery Zones** with minimum order and delivery fee
6. Add **Tables** for reservation management

## 📅 Create a Reservation

1. On the Storefront, navigate to **Reservations**
2. Select a location, date, time, and party size
3. The system checks table availability automatically
4. Submit the booking — staff can confirm it in the admin

## 🍳 Try the Kitchen Display

1. Open two browser tabs
2. In one tab, place an order on the storefront
3. In another tab, navigate to the kitchen display in the admin
4. Watch the order appear in real-time via Socket.IO

## 👉 What's Next

- 🍽️ [Menu Management](/features/menu-management) — Categories, options, allergens, and mealtimes
- ⚙️ [Configuration](/configuration/environment-variables) — Customize payment providers, email, and more
- 📖 [API Reference](/api/overview) — Integrate with external systems
