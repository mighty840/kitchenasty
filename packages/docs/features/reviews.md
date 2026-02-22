# ⭐ Reviews

Customers can leave reviews for locations, and staff can moderate them before they appear publicly.

![Admin Reviews](/screenshots/admin-reviews.png)

## ✍️ Customer Submission

Authenticated customers can submit a review:

| Field | Description |
|-------|------------|
| `locationId` | Which location to review |
| `orderId` | Optional — link to a specific order |
| `rating` | ⭐ 1–5 stars |
| `comment` | Optional text review |

Reviews are created with `isApproved: false` by default.

## 🛡️ Moderation Workflow

1. 📝 Customer submits a review → status: **unapproved**
2. 👀 Staff sees the review in the admin panel review list
3. ✅ Staff approves or rejects the review via `PATCH /api/reviews/:id`
4. 🌐 Approved reviews appear in the public list

## 🌍 Public Display

Approved reviews for a location are publicly accessible:

```
GET /api/reviews/location/:locationId
```

This returns only reviews where `isApproved: true`, ordered by most recent.

## 🔐 Permissions

| Action | Who Can Do It |
|--------|--------------|
| ✍️ Submit review | Authenticated customers |
| 👁️ View public reviews | Anyone |
| 📋 List all reviews (including unapproved) | Staff |
| ✅ Approve/reject reviews | Staff |
| 🗑️ Delete reviews | Manager, Super Admin |

## 📡 API

See [Reviews API](/api/reviews) for the complete endpoint reference.
