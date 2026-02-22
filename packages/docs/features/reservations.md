# 🪑 Reservations

KitchenAsty includes a table reservation system with availability checking and staff management.

![Admin Reservations](/screenshots/admin-reservations.png)

## 🪑 Tables

Each location has tables with a name and capacity:

| Field | Description |
|-------|------------|
| `name` | Table identifier (e.g., "Table 1") |
| `capacity` | Maximum party size |
| `isActive` | Available for booking |
| `locationId` | Which location this table belongs to |

Table names are unique within a location.

## 📋 Booking Flow

1. 🔍 **Check availability** — `GET /api/reservations/availability?locationId=...&date=...&time=...&partySize=...`
2. ✏️ **Create reservation** — `POST /api/reservations` with location, date, time, and party size
3. ✅ **Staff confirms** — Update status to `CONFIRMED` via admin
4. 🍽️ **Day of visit** — Staff marks as `SEATED`, then `COMPLETED`

## 🔍 Availability Check

The availability endpoint returns whether tables are available for the requested date, time, and party size. It checks:

- 🪑 Tables with sufficient capacity
- 🚫 No conflicting reservations at the same time
- ✅ Table is active

![Storefront Reservations](/screenshots/storefront-reservations.png)

## 🔄 Reservation Status Lifecycle

```
PENDING → CONFIRMED → SEATED → COMPLETED
                   ↘ CANCELLED (from any status)
```

| Status | Description |
|--------|------------|
| `PENDING` | ⏳ Customer submitted, awaiting staff confirmation |
| `CONFIRMED` | ✅ Staff confirmed the reservation |
| `SEATED` | 🪑 Customer has arrived and been seated |
| `COMPLETED` | ✔️ Meal finished, table cleared |
| `CANCELLED` | ❌ Reservation cancelled |

## 📝 Reservation Fields

| Field | Description |
|-------|------------|
| `customerId` | Logged-in customer |
| `locationId` | Restaurant location |
| `tableId` | Assigned table (optional, can be assigned later) |
| `date` | Reservation date |
| `time` | Reservation time (e.g., `"19:00"`) |
| `partySize` | Number of guests |
| `comment` | Special requests |

## 👥 Staff Management

Staff can:

- 📋 View all reservations for their location
- ✅ Confirm or cancel pending reservations
- 🪑 Assign tables
- 🔄 Update status as the reservation progresses
- 🗑️ Delete reservations

## 📡 API

See [Reservations API](/api/reservations) for the complete endpoint reference.
