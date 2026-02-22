# 🖼️ Image Uploads

KitchenAsty supports image uploads for menu items via a multipart form data API.

## ⬆️ Upload an Image

```
POST /api/menu/items/:id/image
Authorization: Bearer <staff-token>
Content-Type: multipart/form-data

Form field: image
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "item-id",
    "image": "/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"
  }
}
```

## 🗑️ Delete an Image

```
DELETE /api/menu/items/:id/image
Authorization: Bearer <staff-token>
```

Removes the image file from disk and clears the `image` field on the menu item.

## 🌐 Serving Images

Uploaded images are served statically at `/uploads/`:

```
GET /uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

No authentication is required to view uploaded images.

## 🎨 Accepted Formats

| Format | MIME Type |
|--------|-----------|
| JPEG | `image/jpeg` |
| PNG | `image/png` |
| WebP | `image/webp` |
| GIF | `image/gif` |

## 📏 Limits

| Constraint | Value |
|-----------|-------|
| 📦 Max file size | 5 MB |
| 🔤 Naming | UUID-based (no filename collisions) |

## 🔐 Permissions

| Action | Who Can Do It |
|--------|--------------|
| ⬆️ Upload image | Manager, Super Admin |
| 🗑️ Delete image | Manager, Super Admin |
| 👁️ View image | Anyone |

## ⚙️ Configuration

See [File Uploads](/configuration/file-uploads) for storage configuration and Docker volume setup.
