# 🍔 Menu API

## 📂 Categories

### 📋 List Categories

```
GET /api/menu/categories
```

Public. Returns all categories.

### 🔍 Get Category

```
GET /api/menu/categories/:id
```

Public. Returns a category with its menu items.

### ➕ Create Category

```
POST /api/menu/categories
Authorization: Bearer <manager-token>
```

```json
{
  "name": "Burgers",
  "slug": "burgers",
  "description": "Our signature burgers",
  "sortOrder": 1,
  "isActive": true,
  "parentId": null,
  "locationId": null
}
```

### ✏️ Update Category

```
PATCH /api/menu/categories/:id
Authorization: Bearer <manager-token>
```

### 🗑️ Delete Category

```
DELETE /api/menu/categories/:id
Authorization: Bearer <super-admin-token>
```

## 🍽️ Menu Items

### 📋 List Items

```
GET /api/menu/items?categoryId=...&search=...&page=1&limit=20
```

Public. Supports filtering by category and text search.

### 🔍 Get Item

```
GET /api/menu/items/:id
```

Public. Returns item with options, allergens, and mealtimes.

### ➕ Create Item

```
POST /api/menu/items
Authorization: Bearer <manager-token>
```

```json
{
  "name": "Classic Burger",
  "slug": "classic-burger",
  "description": "Beef patty with lettuce, tomato, and our secret sauce",
  "price": 12.99,
  "categoryId": "category-id",
  "isActive": true,
  "sortOrder": 1,
  "trackStock": false,
  "options": [
    {
      "name": "Size",
      "displayType": "RADIO",
      "isRequired": true,
      "values": [
        { "name": "Regular", "priceModifier": 0, "isDefault": true },
        { "name": "Large", "priceModifier": 3.00 }
      ]
    }
  ]
}
```

### ✏️ Update Item

```
PATCH /api/menu/items/:id
Authorization: Bearer <manager-token>
```

### 🗑️ Delete Item

```
DELETE /api/menu/items/:id
Authorization: Bearer <super-admin-token>
```

### 🖼️ Upload Item Image

```
POST /api/menu/items/:id/image
Authorization: Bearer <manager-token>
Content-Type: multipart/form-data

Form field: image
```

### 🗑️ Delete Item Image

```
DELETE /api/menu/items/:id/image
Authorization: Bearer <manager-token>
```

## ⚠️ Allergens

### 📋 List Allergens

```
GET /api/menu/allergens
```

Public.

### ➕ Create Allergen

```
POST /api/menu/allergens
Authorization: Bearer <manager-token>
```

```json
{
  "name": "Gluten"
}
```

### 🗑️ Delete Allergen

```
DELETE /api/menu/allergens/:id
Authorization: Bearer <super-admin-token>
```

## 🕐 Mealtimes

### 📋 List Mealtimes

```
GET /api/menu/mealtimes
```

Public.

### ➕ Create Mealtime

```
POST /api/menu/mealtimes
Authorization: Bearer <manager-token>
```

```json
{
  "name": "Breakfast",
  "startTime": "06:00",
  "endTime": "11:00",
  "days": [0, 1, 2, 3, 4, 5, 6]
}
```

### ✏️ Update Mealtime

```
PATCH /api/menu/mealtimes/:id
Authorization: Bearer <manager-token>
```

### 🗑️ Delete Mealtime

```
DELETE /api/menu/mealtimes/:id
Authorization: Bearer <super-admin-token>
```

## 🔒 Permissions Summary

| Action | Required Role |
|--------|--------------|
| 🌐 Read categories, items, allergens, mealtimes | Public |
| ✏️ Create / update | Manager, Super Admin |
| 🗑️ Delete | Super Admin |
