# ⚡ Real-Time Events

KitchenAsty uses [Socket.IO](https://socket.io/) for real-time communication between the server and connected clients (admin dashboard, kitchen display).

## 🏗️ Architecture

```
┌──────────────┐     Socket.IO      ┌──────────────┐
│  Admin/KDS   │ ◄────────────────► │    Server     │
│  (React)     │                    │  (Express)    │
└──────────────┘                    └──────────────┘
                                          │
                                    Events emitted
                                    on order/status
                                    changes
```

## 🏠 Rooms

| Room | Format | Purpose |
|------|--------|---------|
| Kitchen | `kitchen:{locationId}` | Kitchen display for a location |
| Order | `order:{orderId}` | Updates for a specific order |

## 📤 Client → Server Events

| Event | Payload | Description |
|-------|---------|------------|
| `join:kitchen` | `{ locationId: string }` | Join the kitchen room for a location |
| `join:order` | `{ orderId: string }` | Subscribe to updates for a specific order |

## 📥 Server → Client Events

| Event | Payload | Description |
|-------|---------|------------|
| `order:created` | Full order object | New order placed at this location |
| `order:updated` | Full order object | Order status or details changed |

## 🖥️ Server-Side Integration

Events are emitted from controllers when orders are created or updated:

```typescript
// In order controller, after creating an order
io.to(`kitchen:${order.locationId}`).emit('order:created', order);

// After status update
io.to(`kitchen:${order.locationId}`).emit('order:updated', order);
io.to(`order:${order.id}`).emit('order:updated', order);
```

## ⚛️ React Client Integration

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join kitchen room
socket.emit('join:kitchen', { locationId });

// Listen for new orders
socket.on('order:created', (order) => {
  // Add order to the kitchen display
});

// Listen for order updates
socket.on('order:updated', (order) => {
  // Update order status in the UI
});
```

## 🤖 Automation Events

Separately from Socket.IO, the server uses Node.js `EventEmitter` for the automation system. These are internal server events that trigger automation rules:

| Event | When |
|-------|------|
| `order.created` | New order placed |
| `order.statusChanged` | Order status updated |
| `reservation.created` | New reservation submitted |
| `review.submitted` | New review submitted |

See [Automation](/features/automation) for details on creating rules that respond to these events.
