# 📍 Locations API

## 📋 List Locations

```
GET /api/locations
```

Public. Returns all active locations.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "Downtown Kitchen",
      "slug": "downtown-kitchen",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "phone": "+1234567890",
      "deliveryEnabled": true,
      "pickupEnabled": true,
      "isActive": true,
      "isBusy": false
    }
  ]
}
```

## 🔍 Get Location

```
GET /api/locations/:id
```

Public. Returns a single location with full details.

## ➕ Create Location

```
POST /api/locations
Authorization: Bearer <manager-token>
```

**Request:**

```json
{
  "name": "Uptown Kitchen",
  "slug": "uptown-kitchen",
  "address": "456 Oak Ave",
  "city": "New York",
  "state": "NY",
  "postalCode": "10002",
  "deliveryEnabled": true,
  "pickupEnabled": true,
  "deliveryLeadTime": 30,
  "pickupLeadTime": 15,
  "minOrderDelivery": 15.00,
  "minOrderPickup": 0
}
```

## ✏️ Update Location

```
PATCH /api/locations/:id
Authorization: Bearer <manager-token>
```

Partial updates supported — only include fields to change.

## 🗑️ Delete Location

```
DELETE /api/locations/:id
Authorization: Bearer <super-admin-token>
```

## 🚚 Delivery Zones

### 📋 List Delivery Zones

```
GET /api/locations/:locationId/delivery-zones
```

### 📍 Check Delivery Zone

```
GET /api/locations/:locationId/delivery-zones/check?lat=40.7128&lng=-74.0060
```

Public. Checks if coordinates fall within a delivery zone and returns the applicable delivery fee.

### ➕ Create Delivery Zone

```
POST /api/locations/:locationId/delivery-zones
Authorization: Bearer <manager-token>
```

```json
{
  "name": "Zone 1 - Downtown",
  "charge": 3.99,
  "minOrder": 15.00,
  "boundaries": { "type": "Polygon", "coordinates": [...] },
  "isActive": true
}
```

### ✏️🗑️ Update / Delete Delivery Zone

```
PATCH /api/locations/:locationId/delivery-zones/:zoneId
DELETE /api/locations/:locationId/delivery-zones/:zoneId
```

## 🪑 Tables

### 📋 List Tables

```
GET /api/locations/:locationId/tables
```

### 🔍 Get Table

```
GET /api/locations/:locationId/tables/:tableId
```

### ➕ Create Table

```
POST /api/locations/:locationId/tables
Authorization: Bearer <manager-token>
```

```json
{
  "name": "Table 1",
  "capacity": 4,
  "isActive": true
}
```

### ✏️🗑️ Update / Delete Table

```
PATCH /api/locations/:locationId/tables/:tableId
DELETE /api/locations/:locationId/tables/:tableId
```

## 🔒 Permissions Summary

| Action | Required Role |
|--------|--------------|
| 🌐 List / get locations | Public |
| ✏️ Create / update locations | Manager, Super Admin |
| 🗑️ Delete locations | Super Admin |
| 🌐 List / check delivery zones | Public |
| ✏️ Manage delivery zones | Manager, Super Admin |
| 🗑️ Delete delivery zones | Super Admin |
| 🌐 List / get tables | Public |
| ✏️ Manage tables | Manager, Super Admin |
| 🗑️ Delete tables | Super Admin |
