<!--
Documents the backend API endpoints for upload.
It summarizes how clients should call the related routes and what responses to expect.
-->

# Upload Endpoints

Endpoints for uploading files to Supabase Storage. All endpoints use `multipart/form-data` (except `from-url` which uses JSON). Files are stored in public buckets and a public URL is returned.

---

## Upload Player Photo

Uploads an image file and stores it under the player's folder in Supabase Storage.

- **URL:** `/upload/player/:playerId`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Auth required:** Yes (Admin/Superadmin)
- **Storage bucket:** `player-photos`
- **Storage path:** `{playerId}/{timestamp}.{ext}`

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `playerId` | `number` | Player ID |

#### Request Body (form-data)
| Field | Type | Description |
|-------|------|-------------|
| `file` | `File` | Image file to upload (max 10 MB) |

#### Success Response `201`
```json
{
  "success": true,
  "data": {
    "publicUrl": "https://sbgqqnvgywxpemqhiaxa.supabase.co/storage/v1/object/public/player-photos/1/1700000000000.jpg",
    "path": "1/1700000000000.jpg",
    "bucket": "player-photos"
  }
}
```

---

## Upload Staff Photo

Uploads an image file for a staff member.

- **URL:** `/upload/staff/:staffId`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Auth required:** Yes (Admin/Superadmin)
- **Storage bucket:** `staff-photos`
- **Storage path:** `{staffId}/{timestamp}.{ext}`

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `staffId` | `number` | Staff member ID |

#### Request Body (form-data)
| Field | Type | Description |
|-------|------|-------------|
| `file` | `File` | Image file to upload (max 10 MB) |

#### Success Response `201`
Same structure as Upload Player Photo, with `bucket: "staff-photos"`.

---

## Upload News Image

Uploads a banner or cover image for a news article.

- **URL:** `/upload/news/:articleId`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Auth required:** Yes (Admin/Superadmin)
- **Storage bucket:** `news-images`
- **Storage path:** `{articleId}/{timestamp}.{ext}`

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `articleId` | `string (uuid)` | News article ID |

#### Request Body (form-data)
| Field | Type | Description |
|-------|------|-------------|
| `file` | `File` | Image file to upload (max 10 MB) |

#### Success Response `201`
Same structure as Upload Player Photo, with `bucket: "news-images"`.

---

## Upload Media (Gallery)

Uploads a photo or video to the media gallery. Available to any authenticated user.

- **URL:** `/upload/media`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Auth required:** Yes (any authenticated user)
- **Storage bucket:** `media-gallery`
- **Storage path:** `{year}/{month}/{timestamp}.{ext}`

#### Request Body (form-data)
| Field | Type | Description |
|-------|------|-------------|
| `file` | `File` | Image file to upload (max 10 MB) |

#### Success Response `201`
Same structure as Upload Player Photo, with `bucket: "media-gallery"`.

---

## Upload from URL

Downloads a file from an external URL and uploads it directly to Supabase Storage. Supports Google Drive share links via automatic URL transformation.

- **URL:** `/upload/from-url`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Auth required:** Yes (Admin/Superadmin)

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | Yes | Source URL. Google Drive share links are automatically transformed |
| `bucket` | `string` | Yes | Target Supabase Storage bucket name |
| `path` | `string` | Yes | Full path inside the bucket (e.g. `1/photo.jpg`) |

#### Google Drive URL Transformation

Share links are automatically converted to direct download links:

| Input | Output |
|-------|--------|
| `https://drive.google.com/file/d/{fileId}/view?usp=sharing` | `https://drive.google.com/uc?export=download&id={fileId}` |

#### Example Request Body
```json
{
  "url": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/view",
  "bucket": "player-photos",
  "path": "1/foto_drive.jpg"
}
```

#### Success Response `201`
```json
{
  "success": true,
  "data": {
    "publicUrl": "https://sbgqqnvgywxpemqhiaxa.supabase.co/storage/v1/object/public/player-photos/1/foto_drive.jpg",
    "path": "1/foto_drive.jpg",
    "bucket": "player-photos"
  }
}
```

---

## Storage Buckets Required

The following Supabase Storage buckets must exist and be configured as **public**:

| Bucket | Purpose |
|--------|---------|
| `player-photos` | Player photos |
| `staff-photos` | Staff member photos |
| `news-images` | News article cover images |
| `media-gallery` | General media gallery |

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| `400` | — | Invalid parameters, no file received, or source URL not downloadable |
| `401` | `NO_TOKEN` / `INVALID_TOKEN` | Missing or invalid JWT |
| `403` | `FORBIDDEN` | Insufficient role permissions |
| `500` | — | Supabase Storage upload error |
