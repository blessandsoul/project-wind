# Template Thumbnail Management — Design Spec

## Summary

Add admin endpoints for uploading and deleting template thumbnail images. Templates currently have a `thumbnailUrl` field in the database but no way to populate it. This feature follows the existing avatar upload pattern — same validation, optimization, and file storage conventions.

## New API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/templates/:templateId/thumbnail` | Admin | Upload/replace thumbnail image |
| `DELETE` | `/api/v1/templates/:templateId/thumbnail` | Admin | Remove thumbnail image |

Both endpoints require `authenticate` + `authorize('ADMIN')` middleware. Rate limited with `RATE_LIMITS.TEMPLATES_ADMIN` (same as existing admin template routes).

## File Storage

### Directory Structure

```
uploads/
├── templates/
│   └── {templateId}/
│       └── thumbnail/
│           └── {slug}-thumbnail.webp
```

### Naming

- Filename: `{template-slug}-thumbnail.webp` (e.g., `professional-headshot-thumbnail.webp`)
- Generated via a new `generateThumbnailFilename(slug)` helper in `filename-sanitizer.ts`
- Public URL: `/uploads/templates/{templateId}/thumbnail/{slug}-thumbnail.webp`

### Cleanup

- On thumbnail delete: remove `uploads/templates/{templateId}/thumbnail/` subfolder only (not the entire entity directory — preserves future media subfolders like `preview/`, `before-after/`)
- On template delete (soft delete via `isActive = false`): thumbnail files remain on disk (template can be reactivated)

## Image Processing

Reuse the existing avatar optimization pipeline — the config is identical to what thumbnails need:

- Max dimensions: 512×512px (aspect ratio preserved, no upscaling)
- Format: WebP, 85% quality
- EXIF metadata stripped
- Compression effort: 4/6

Uses `imageOptimizerService.optimizeAvatar()` directly (no new optimization method needed).

## Request/Response

### Upload Thumbnail

**Request:** `POST /api/v1/templates/:templateId/thumbnail`
- Content-Type: `multipart/form-data`
- Body: single file field (any name)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`
- Max size: configured via `MAX_FILE_SIZE_MB` env var (default 10MB)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Thumbnail uploaded successfully",
  "data": {
    "id": "3decaa02-...",
    "name": "Professional Headshot",
    "slug": "professional-headshot",
    "thumbnailUrl": "/uploads/templates/3decaa02-.../thumbnail/professional-headshot-thumbnail.webp",
    "...": "other template fields"
  }
}
```

**Errors:**
- `422 VALIDATION_FAILED` — invalid file type, extension, empty file, too large
- `404 RESOURCE_NOT_FOUND` — template not found
- `401 UNAUTHORIZED` — not authenticated
- `403 FORBIDDEN` — not admin

### Delete Thumbnail

**Request:** `DELETE /api/v1/templates/:templateId/thumbnail`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Thumbnail deleted successfully",
  "data": null
}
```

**Errors:**
- `400 BAD_REQUEST` — template has no thumbnail
- `404 RESOURCE_NOT_FOUND` — template not found
- `401 UNAUTHORIZED` — not authenticated
- `403 FORBIDDEN` — not admin

## Upload Flow (Step by Step)

1. Admin sends `POST` with multipart file
2. Controller extracts file via `request.file()`
3. Controller validates file and reads buffer via `validateImageFile(file)` — returns `{ buffer, mimeType, filename }` (single function handles MIME type, extension, size, and buffer extraction)
4. Controller calls `templatesService.uploadThumbnail(templateId, buffer)`
5. Service fetches template (throws `NotFoundError` if missing — works for both active and inactive templates, allowing admins to prepare thumbnails before reactivation)
6. Service optimizes image via `imageOptimizerService.optimizeAvatar(buffer)`
7. Service saves file via `fileStorageService.saveThumbnail(templateId, optimizedBuffer, template.slug)`
8. Service updates DB via `templatesRepo.updateThumbnailUrl(templateId, url)`
9. Service returns sanitized template
10. Controller returns via `successResponse()`

**Note:** `saveThumbnail(templateId, buffer, slug)` takes a single `slug` parameter for filename generation, unlike `saveAvatar(userId, buffer, firstName, lastName)` which takes two name parts. This is intentional — templates already have a pre-generated slug.

## Delete Flow (Step by Step)

1. Admin sends `DELETE`
2. Controller extracts `templateId` from params
3. Controller calls `templatesService.deleteThumbnail(templateId)`
4. Service fetches template (throws `NotFoundError` if missing)
5. Service checks `thumbnailUrl` exists (throws `BadRequestError` if null)
6. Service deletes files via `fileStorageService.deleteThumbnail(templateId)`
7. Service clears DB via `templatesRepo.clearThumbnailUrl(templateId)`
8. Controller returns via `successResponse()` with null data

## Files to Change

### Modified

| File | What Changes |
|------|-------------|
| `server/src/libs/storage/file-storage.service.ts` | Add `templatesDir` property, `saveThumbnail()`, `deleteThumbnail()`, `getThumbnailUrl()` methods, initialize templates dir in `initialize()` |
| `server/src/libs/storage/filename-sanitizer.ts` | Add `generateThumbnailFilename(slug, extension?)` function |
| `server/src/modules/templates/templates.routes.ts` | Add 2 new admin routes (POST/DELETE thumbnail) |
| `server/src/modules/templates/templates.controller.ts` | Add `uploadThumbnail()`, `deleteThumbnail()` methods |
| `server/src/modules/templates/templates.service.ts` | Add `uploadThumbnail()`, `deleteThumbnail()` methods |
| `server/src/modules/templates/templates.repo.ts` | Add `updateThumbnailUrl()`, `clearThumbnailUrl()` functions |
| `server/postman/collection.json` | Add 2 new requests under Templates folder |

### No New Files

All changes extend existing files following established patterns.

## Key Decisions

1. **Reuse `optimizeAvatar()` instead of creating `optimizeThumbnail()`** — the optimization config (512×512, WebP 85%) is identical. Adding a separate method would be YAGNI. If thumbnail requirements diverge later, we can extract then.

2. **Upload replaces existing thumbnail** — no need for a separate "update" endpoint. POST is idempotent: if a thumbnail already exists, the old file is overwritten. This avoids orphaned files and keeps the API simple.

3. **Soft-deleted templates keep their thumbnails** — since `deleteTemplate` only sets `isActive = false`, the template can be reactivated with its thumbnail intact. Physical file cleanup would only happen if we implement hard delete.

4. **Directory structure: `templates/{templateId}/thumbnail/`** — follows the `{domain}/{entityId}/{media-type}/` convention used by users and generations. The `thumbnail/` subfolder allows adding other media types later (e.g., `preview/`, `before-after/`) without restructuring.

5. **Inactive templates can receive thumbnails** — admins may want to prepare a template's thumbnail before reactivating it. The `findById` repo method returns templates regardless of `isActive` status.

6. **Concurrent uploads: last write wins** — since this is an admin-only endpoint with low concurrency, no locking is needed. If two admins upload simultaneously, the last file written to disk and the last DB update both win independently.

## No Deployment Impact

- No new environment variables
- No database schema changes (`thumbnailUrl` field already exists)
- No new npm dependencies
- No Dockerfile changes (uploads directory already created and volume-mountable)
- The `uploads/templates/` directory is created at runtime by `fileStorageService.initialize()`
