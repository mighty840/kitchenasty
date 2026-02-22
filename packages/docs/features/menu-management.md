# 🍽️ Menu Management

KitchenAsty provides a comprehensive menu system with hierarchical categories, configurable item options, allergen tracking, and mealtime restrictions.

![Admin Menu Management](/screenshots/admin-menu.png)

## 📂 Categories

Categories organize menu items and support a parent-child hierarchy.

| Field | Description |
|-------|------------|
| `name` | Display name |
| `slug` | URL-friendly identifier (unique) |
| `description` | Optional description |
| `image` | Optional category image |
| `sortOrder` | Display order (lower = first) |
| `isActive` | Show/hide on storefront |
| `parentId` | Parent category for nesting |
| `locationId` | Scope to a specific location (optional) |

### 🏗️ Hierarchical Categories

Categories can be nested one level deep:

```
Mains
├── Burgers
├── Pasta
└── Salads
Drinks
├── Hot Drinks
└── Cold Drinks
```

Set `parentId` when creating a child category.

## 🍕 Menu Items

| Field | Description |
|-------|------------|
| `name` | Item name |
| `slug` | URL-friendly identifier (unique) |
| `description` | Item description |
| `price` | Base price |
| `image` | Uploaded image path |
| `isActive` | Show/hide on storefront |
| `sortOrder` | Display order within category |
| `trackStock` | Enable stock tracking |
| `stockQty` | Available quantity (when tracking) |
| `orderType` | Restrict to `DELIVERY` or `PICKUP` only (null = both) |
| `categoryId` | Parent category |
| `locationId` | Scope to a specific location (optional) |

## 🎛️ Menu Options

Options let customers customize items. Each item can have multiple option groups.

| Field | Description |
|-------|------------|
| `name` | Option group name (e.g., "Size", "Toppings") |
| `displayType` | How options are shown to the customer |
| `isRequired` | Must the customer select something? |
| `minSelect` | Minimum selections |
| `maxSelect` | Maximum selections |

### 🖥️ Display Types

| Type | Behavior |
|------|---------|
| `SELECT` | Dropdown — single selection |
| `RADIO` | Radio buttons — single selection |
| `CHECKBOX` | Checkboxes — multiple selections |
| `QUANTITY` | Quantity stepper — select amount per option |

### 🏷️ Option Values

Each option group has one or more values:

| Field | Description |
|-------|------------|
| `name` | Value label (e.g., "Large") |
| `priceModifier` | Added/subtracted from base price |
| `isDefault` | Pre-selected when loading the item |

## ⚠️ Allergens

Allergens are global and linked to items via a many-to-many relationship.

```
GET /api/menu/allergens
```

Create allergens, then assign them to items when creating/updating menu items.

## 🕐 Mealtimes

Mealtimes restrict when items are available:

| Field | Description |
|-------|------------|
| `name` | e.g., "Breakfast", "Lunch" |
| `startTime` | Start time (`"06:00"`) |
| `endTime` | End time (`"11:00"`) |
| `days` | Active days (`[0,1,2,3,4,5,6]`) |
| `locationId` | Optional location scope |

Link items to mealtimes to show them only during those time windows.

## 📡 API

See [Menu API](/api/menu) for the complete endpoint reference.
