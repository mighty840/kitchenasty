# 📊 Dashboard API

## 📈 Get Stats

```
GET /api/dashboard/stats
Authorization: Bearer <staff-token>
```

Returns overview statistics for the admin dashboard.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalOrders": 1250,
    "totalRevenue": 45230.50,
    "totalCustomers": 340,
    "pendingOrders": 5,
    "todayOrders": 23,
    "todayRevenue": 892.00
  }
}
```

## 📉 Get Analytics

```
GET /api/dashboard/analytics?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <staff-token>
```

Returns time-series analytics data for the specified date range.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|------------|
| `startDate` | ISO date string | 📅 Start of range |
| `endDate` | ISO date string | 📅 End of range |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-01",
      "orders": 15,
      "revenue": 542.30,
      "newCustomers": 3
    },
    {
      "date": "2025-01-02",
      "orders": 22,
      "revenue": 789.10,
      "newCustomers": 5
    }
  ]
}
```

## 🔒 Permissions

Both endpoints require staff authentication. All staff roles (STAFF, MANAGER, SUPER_ADMIN) have access.
