# 📊 Database Schema

The database schema is defined in `prisma/schema.prisma` using Prisma ORM. It targets PostgreSQL 16.

## 📋 Models by Domain

### 👤 Users & Authentication

| Model | Table | Description |
|-------|-------|------------|
| `User` | `users` | Staff/admin accounts with roles |
| `Customer` | `customers` | Customer accounts (registered or guest) |
| `CustomerGroup` | `customer_groups` | Customer segmentation |
| `Address` | `addresses` | Customer delivery addresses |

### 📍 Locations

| Model | Table | Description |
|-------|-------|------------|
| `Location` | `locations` | Restaurant locations |
| `OperatingHour` | `operating_hours` | Per-day open/close times |
| `DeliveryZone` | `delivery_zones` | Delivery areas with fees |

### 🍽️ Menu

| Model | Table | Description |
|-------|-------|------------|
| `Category` | `categories` | Menu categories (hierarchical) |
| `MenuItem` | `menu_items` | Menu items with pricing |
| `MenuOption` | `menu_options` | Option groups (Size, Toppings) |
| `MenuOptionValue` | `menu_option_values` | Individual options (Small, Large) |
| `Mealtime` | `mealtimes` | Time-based availability windows |
| `MenuItemMealtime` | `menu_item_mealtimes` | Item ↔ mealtime junction |
| `Allergen` | `allergens` | Allergen types |
| `MenuItemAllergen` | `menu_item_allergens` | Item ↔ allergen junction |

### 🛒 Orders & Payments

| Model | Table | Description |
|-------|-------|------------|
| `Order` | `orders` | Customer orders |
| `OrderItem` | `order_items` | Line items in an order |
| `OrderItemOption` | `order_item_options` | Selected options per line item |
| `Payment` | `payments` | Payment records (Stripe, PayPal, cash) |

### 🪑 Reservations

| Model | Table | Description |
|-------|-------|------------|
| `Table` | `tables` | Restaurant tables |
| `Reservation` | `reservations` | Table reservations |

### 📣 Marketing & Engagement

| Model | Table | Description |
|-------|-------|------------|
| `Coupon` | `coupons` | Discount coupons |
| `Review` | `reviews` | Customer reviews |
| `LoyaltyTransaction` | `loyalty_transactions` | Loyalty point history |
| `AutomationRule` | `automation_rules` | Event-driven automation |

## 🏷️ Enums

| Enum | Values |
|------|--------|
| `Role` | `SUPER_ADMIN`, `MANAGER`, `STAFF` |
| `OrderType` | `DELIVERY`, `PICKUP` |
| `OrderStatus` | `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `PICKED_UP`, `CANCELLED` |
| `PaymentMethod` | `CASH`, `STRIPE`, `PAYPAL` |
| `PaymentStatus` | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` |
| `ReservationStatus` | `PENDING`, `CONFIRMED`, `SEATED`, `COMPLETED`, `CANCELLED` |
| `CouponType` | `PERCENTAGE`, `FIXED`, `FREE_DELIVERY` |
| `MenuOptionDisplayType` | `SELECT`, `RADIO`, `CHECKBOX`, `QUANTITY` |
| `LoyaltyTransactionType` | `EARN`, `REDEEM`, `ADJUST` |

## 🔗 Key Relationships

- 👤 `User` belongs to a `Location` (optional staff assignment)
- 🛍️ `Customer` has many `Address`, `Order`, `Reservation`, `Review`, `LoyaltyTransaction`
- 📍 `Location` has many `Category`, `MenuItem`, `Table`, `DeliveryZone`, `OperatingHour`, `Order`, `Reservation`, `Review`
- 📂 `Category` has self-referential parent/children for nesting
- 🍔 `MenuItem` belongs to `Category`, has many `MenuOption`, `MenuItemMealtime`, `MenuItemAllergen`
- 📦 `Order` has many `OrderItem`, `Payment`, `Review`, `LoyaltyTransaction`
- 📋 `OrderItem` has many `OrderItemOption` (snapshot of selected options)

## 🗑️ Cascade Behaviors

The following relations use `onDelete: Cascade`:

- `Address` → deleted when `Customer` is deleted
- `OrderItem` → deleted when `Order` is deleted
- `OrderItemOption` → deleted when `OrderItem` is deleted
- `Payment` → deleted when `Order` is deleted
- `MenuOption` → deleted when `MenuItem` is deleted
- `MenuOptionValue` → deleted when `MenuOption` is deleted
- `Table` → deleted when `Location` is deleted
- `DeliveryZone` → deleted when `Location` is deleted
- `OperatingHour` → deleted when `Location` is deleted
- Junction tables (`MenuItemMealtime`, `MenuItemAllergen`) → deleted when either side is deleted
