# 📅 Reservations API

## 🔍 Check Availability

```
GET /api/reservations/availability?locationId=...&date=2025-06-15&time=19:00&partySize=4
```

Public. Checks if tables are available.

**Response:**

```json
{
  "success": true,
  "data": {
    "available": true,
    "tables": [
      { "id": "table-id", "name": "Table 3", "capacity": 4 }
    ]
  }
}
```

## ➕ Create Reservation

```
POST /api/reservations
Authorization: Bearer <customer-token>
```

**Request:**

```json
{
  "locationId": "location-id",
  "date": "2025-06-15",
  "time": "19:00",
  "partySize": 4,
  "comment": "Birthday dinner, window seat preferred"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "date": "2025-06-15",
    "time": "19:00",
    "partySize": 4,
    "status": "PENDING",
    "comment": "Birthday dinner, window seat preferred"
  }
}
```

## 🛍️ List Customer Reservations

```
GET /api/reservations/my-reservations
Authorization: Bearer <customer-token>
```

Returns reservations for the authenticated customer.

## 📋 List All Reservations (Staff)

```
GET /api/reservations
Authorization: Bearer <staff-token>
```

Returns all reservations with pagination. Staff only.

## 🔍 Get Reservation

```
GET /api/reservations/:id
Authorization: Bearer <token>
```

## ✏️ Update Reservation

```
PATCH /api/reservations/:id
Authorization: Bearer <staff-token>
```

**Request:**

```json
{
  "status": "CONFIRMED",
  "tableId": "table-id"
}
```

## 🗑️ Delete Reservation

```
DELETE /api/reservations/:id
Authorization: Bearer <staff-token>
```

## 🔒 Permissions Summary

| Action | Required Role |
|--------|--------------|
| 🌐 Check availability | Public |
| ➕ Create reservation | Authenticated customer |
| 👤 View own reservations | Authenticated customer |
| 📋 List all reservations | Staff |
| ✏️ Update reservation | Staff |
| 🗑️ Delete reservation | Staff |

## ⚠️ Error Cases

| Scenario | Status | Error |
|----------|--------|-------|
| 🪑 No tables available | `400` | No availability for the requested time |
| 👥 Party size too large | `400` | No table with sufficient capacity |
| 📍 Location not found | `404` | Location not found |
| 📅 Past date | `400` | Cannot reserve in the past |
