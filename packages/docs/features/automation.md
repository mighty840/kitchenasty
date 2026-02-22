# ⚡ Automation

KitchenAsty's automation system lets you create event-driven rules that trigger actions like sending emails, calling webhooks, or sending SMS messages.

![Admin Automation](/screenshots/admin-automation.png)

## ⚙️ How It Works

1. 🎯 An **event** fires (e.g., a new order is created)
2. 🔍 The automation engine loads all active rules matching that event
3. ✅ Each rule's **conditions** are evaluated against the event data
4. 🚀 If conditions match, the rule's **actions** are executed

## 📡 Events

| Event | Trigger |
|-------|---------|
| `order.created` | 🛒 New order placed |
| `order.statusChanged` | 🔄 Order status updated |
| `reservation.created` | 🪑 New reservation submitted |
| `review.submitted` | ⭐ New review submitted |

## 🔍 Conditions

Conditions are a JSON object that is matched against the event data. All specified conditions must match (AND logic).

```json
{
  "status": "CONFIRMED"
}
```

Nested conditions are supported using dot notation:

```json
{
  "order.status": "READY",
  "order.orderType": "DELIVERY"
}
```

Set conditions to `null` to match all events of that type.

## 🎬 Actions

Actions are a JSON array of operations to perform:

```json
[
  {
    "type": "email",
    "template": "orderConfirmation",
    "to": "customer"
  }
]
```

### 🔧 Action Types

| Type | Description |
|------|------------|
| `email` | 📧 Send an email using SMTP |
| `webhook` | 🔗 POST event data to a URL |
| `sms` | 💬 Send an SMS message |

### 📝 Template Variables

Actions support template variables that are replaced at execution time:

| Variable | Description |
|----------|------------|
| <code v-pre>{{customer.name}}</code> | 👤 Customer name |
| <code v-pre>{{customer.email}}</code> | 📧 Customer email |
| <code v-pre>{{order.orderNumber}}</code> | 🔢 Order number |
| <code v-pre>{{order.total}}</code> | 💰 Order total |
| <code v-pre>{{order.status}}</code> | 🔄 Order status |
| <code v-pre>{{location.name}}</code> | 📍 Location name |
| <code v-pre>{{reservation.date}}</code> | 📅 Reservation date |
| <code v-pre>{{reservation.time}}</code> | 🕐 Reservation time |

## 💡 Examples

### 📧 Send email on order confirmation

```json
{
  "name": "Order Confirmation Email",
  "event": "order.statusChanged",
  "conditions": { "status": "CONFIRMED" },
  "actions": [
    {
      "type": "email",
      "template": "orderConfirmation",
      "to": "customer",
      "subject": "Your order #{{order.orderNumber}} is confirmed"
    }
  ],
  "isActive": true
}
```

### 🔗 Webhook on new order

```json
{
  "name": "New Order Webhook",
  "event": "order.created",
  "conditions": null,
  "actions": [
    {
      "type": "webhook",
      "url": "https://hooks.example.com/new-order",
      "method": "POST"
    }
  ],
  "isActive": true
}
```

### 💬 SMS when order is ready

```json
{
  "name": "Order Ready SMS",
  "event": "order.statusChanged",
  "conditions": { "status": "READY" },
  "actions": [
    {
      "type": "sms",
      "to": "customer",
      "message": "Your order #{{order.orderNumber}} is ready for pickup!"
    }
  ],
  "isActive": true
}
```

## 🔐 Permissions

| Action | Who Can Do It |
|--------|--------------|
| 📋 List/view automation rules | Manager, Super Admin |
| ✏️ Create/update rules | Manager, Super Admin |
| 🗑️ Delete rules | Super Admin |

## 📡 API

See [Automation API](/api/automation) for the complete endpoint reference.
