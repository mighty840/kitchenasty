# 📁 File Uploads

KitchenAsty handles image uploads for menu items using Multer middleware.

## ⚙️ Configuration

Uploads are saved to the `uploads/` directory at the server root. Files are served statically at `/uploads/`.

### 🖼️ Accepted Formats

| MIME Type | Extension |
|-----------|-----------|
| `image/jpeg` | .jpg, .jpeg |
| `image/png` | .png |
| `image/webp` | .webp |
| `image/gif` | .gif |

### 📏 Limits

| Setting | Value |
|---------|-------|
| Max file size | 5 MB |
| Storage | Disk (`uploads/` directory) |
| Filename | UUID-based to avoid collisions |

## 📤 Upload API

```
POST /api/menu/items/:id/image
Content-Type: multipart/form-data
Authorization: Bearer <staff-token>

Form field: image
```

See [Image Uploads](/features/image-uploads) for the full API reference.

## 🐳 Docker Volumes

In Docker, the uploads directory is inside the container. To persist uploads across container restarts, mount a volume in `docker-compose.yml`:

```yaml
server:
  volumes:
    - ./uploads:/app/uploads
```

## 🌐 Serving Uploaded Files

The Express server serves uploaded files at `/uploads/`:

```typescript
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
```

In Docker, the admin and storefront nginx configs proxy `/uploads/` to the server container.

## 🏭 Production Notes

For production deployments, consider:

- 💾 Mounting a persistent volume for the uploads directory
- ☁️ Using a CDN or object storage (S3) for uploaded images
- 📏 Setting appropriate file size limits at the nginx level
