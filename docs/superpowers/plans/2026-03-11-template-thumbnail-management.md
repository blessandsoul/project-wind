# Template Thumbnail Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin endpoints for uploading and deleting template thumbnail images, following the existing avatar upload pattern.

**Architecture:** Extend the existing file storage service with template-specific methods. Add two new admin routes (POST/DELETE) to the templates module. Follow the same controller → service → repo layering used by avatar uploads.

**Tech Stack:** Fastify, @fastify/multipart, Sharp (via existing imageOptimizerService), Prisma, Zod

**Spec:** `docs/superpowers/specs/2026-03-11-template-thumbnail-management-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `server/src/libs/storage/filename-sanitizer.ts` | Modify | Add `generateThumbnailFilename(slug)` |
| `server/src/libs/storage/file-storage.service.ts` | Modify | Add `templatesDir`, `saveThumbnail()`, `deleteThumbnail()` |
| `server/src/modules/templates/templates.repo.ts` | Modify | Add `updateThumbnailUrl()`, `clearThumbnailUrl()` |
| `server/src/modules/templates/templates.service.ts` | Modify | Add `uploadThumbnail()`, `deleteThumbnail()` |
| `server/src/modules/templates/templates.controller.ts` | Modify | Add `uploadThumbnail()`, `deleteThumbnail()` handlers |
| `server/src/modules/templates/templates.routes.ts` | Modify | Add 2 new admin routes |
| `server/postman/collection.json` | Modify | Add 2 new requests |

---

## Chunk 1: Storage & Data Layer

### Task 1: Add thumbnail filename generator

**Files:**
- Modify: `server/src/libs/storage/filename-sanitizer.ts:72` (append after existing code)

- [ ] **Step 1: Add `generateThumbnailFilename` function**

Add this function at the end of `filename-sanitizer.ts`:

```typescript
/**
 * Generates an SEO-friendly thumbnail filename based on template slug
 *
 * Format: {slug}-thumbnail.{extension}
 *
 * @param slug - Template slug (already sanitized)
 * @param extension - File extension (default: 'webp')
 * @returns SEO-friendly filename
 *
 * @example
 * generateThumbnailFilename("professional-headshot") // "professional-headshot-thumbnail.webp"
 */
export function generateThumbnailFilename(
  slug: string,
  extension: string = 'webp'
): string {
  const sanitized = sanitizeForFilename(slug);
  const name = sanitized || 'template';
  return `${name}-thumbnail.${extension}`;
}
```

- [ ] **Step 2: Verify the import works**

Run: `cd server && npx tsc --noEmit`
Expected: No errors related to filename-sanitizer

- [ ] **Step 3: Commit**

```bash
git add server/src/libs/storage/filename-sanitizer.ts
git commit -m "feat: add generateThumbnailFilename helper"
```

---

### Task 2: Add template file storage methods

**Files:**
- Modify: `server/src/libs/storage/file-storage.service.ts`

- [ ] **Step 1: Add import for `generateThumbnailFilename`**

Update the import at line 12 from:

```typescript
import { generateAvatarFilename } from './filename-sanitizer.js';
```

to:

```typescript
import { generateAvatarFilename, generateThumbnailFilename } from './filename-sanitizer.js';
```

- [ ] **Step 2: Add `templatesDir` property and update constructor**

In the class, add the new property after line 23:

```typescript
private readonly templatesDir: string;
```

In the constructor (after line 31), add:

```typescript
// Templates media directory: server/uploads/templates
this.templatesDir = path.join(this.uploadDir, 'templates');
```

- [ ] **Step 3: Add template directory helpers**

Add after the `getUserAvatarDir` method (after line 46):

```typescript
// ─── Template Directory Helpers ─────────────────────────────

/**
 * Gets the base directory for a template's media
 */
private getTemplateDir(templateId: string): string {
  return path.join(this.templatesDir, templateId);
}

/**
 * Gets the thumbnail directory for a template
 */
private getTemplateThumbnailDir(templateId: string): string {
  return path.join(this.getTemplateDir(templateId), 'thumbnail');
}
```

- [ ] **Step 4: Add `saveThumbnail` method**

Add after the `getAvatarUrl` method (after line 193), before the Generation section:

```typescript
// ─── Template Thumbnail Operations ──────────────────────────

/**
 * Saves a thumbnail image to template-specific directory
 *
 * @param templateId - Template's unique ID
 * @param buffer - Optimized image buffer
 * @param slug - Template slug (for SEO filename)
 * @returns Filename and public URL
 */
async saveThumbnail(
  templateId: string,
  buffer: Buffer,
  slug: string,
): Promise<{ filename: string; url: string }> {
  try {
    const thumbnailDir = this.getTemplateThumbnailDir(templateId);
    await this.ensureDirectoryExists(thumbnailDir);

    const filename = generateThumbnailFilename(slug, 'webp');
    const filePath = path.join(thumbnailDir, filename);

    await fs.writeFile(filePath, buffer);

    const url = `/uploads/templates/${templateId}/thumbnail/${filename}`;

    logger.info({
      msg: 'Template thumbnail saved',
      templateId,
      filename,
      fileSize: buffer.length,
    });

    return { filename, url };
  } catch (error) {
    logger.error({ err: error, msg: 'Failed to save template thumbnail', templateId });
    throw new InternalError('Failed to save thumbnail file', 'FILE_SAVE_FAILED');
  }
}

/**
 * Deletes a template's thumbnail directory
 *
 * Only deletes the thumbnail/ subfolder, not the entire template directory.
 *
 * @param templateId - Template's unique ID
 */
async deleteThumbnail(templateId: string): Promise<void> {
  try {
    const thumbnailDir = this.getTemplateThumbnailDir(templateId);

    const exists = await this.directoryExists(thumbnailDir);
    if (!exists) {
      logger.info({ msg: 'Thumbnail directory does not exist, nothing to delete', templateId });
      return;
    }

    await fs.rm(thumbnailDir, { recursive: true, force: true });

    logger.info({ msg: 'Template thumbnail deleted', templateId });
  } catch (error) {
    logger.error({ err: error, msg: 'Failed to delete template thumbnail', templateId });
    throw new InternalError('Failed to delete thumbnail file', 'FILE_DELETE_FAILED');
  }
}
```

- [ ] **Step 5: Update `initialize()` to create templates directory**

In the `initialize()` method, add after `await this.ensureDirectoryExists(this.generationsDir);` (line 376):

```typescript
await this.ensureDirectoryExists(this.templatesDir);
```

- [ ] **Step 6: Verify compilation**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add server/src/libs/storage/file-storage.service.ts
git commit -m "feat: add template thumbnail storage methods"
```

---

### Task 3: Add template repository methods

**Files:**
- Modify: `server/src/modules/templates/templates.repo.ts:96` (append after existing code)

- [ ] **Step 1: Add `updateThumbnailUrl` and `clearThumbnailUrl` functions**

Append at the end of `templates.repo.ts`:

```typescript
export async function updateThumbnailUrl(
  id: string,
  thumbnailUrl: string,
): Promise<Template> {
  return prisma.template.update({
    where: { id },
    data: { thumbnailUrl },
  });
}

export async function clearThumbnailUrl(id: string): Promise<Template> {
  return prisma.template.update({
    where: { id },
    data: { thumbnailUrl: null },
  });
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/templates/templates.repo.ts
git commit -m "feat: add template thumbnail repository methods"
```

---

## Chunk 2: Service, Controller & Routes

### Task 4: Add template service thumbnail methods

**Files:**
- Modify: `server/src/modules/templates/templates.service.ts`

- [ ] **Step 1: Add imports**

Update the imports at the top of the file. After line 2, add:

```typescript
import { BadRequestError } from '@shared/errors/errors.js';
import { imageOptimizerService } from '@libs/storage/image-optimizer.service.js';
import { fileStorageService } from '@libs/storage/file-storage.service.js';
```

(Note: `NotFoundError` and `ConflictError` are already imported on line 2.)

- [ ] **Step 2: Add `uploadThumbnail` and `deleteThumbnail` methods**

Add these methods inside the `TemplatesService` class, after the `getCategories()` method (after line 157) and before `interpolatePrompt`:

```typescript
async uploadThumbnail(
  templateId: string,
  buffer: Buffer,
): Promise<SanitizedTemplate> {
  const template = await templatesRepo.findById(templateId);
  if (!template) {
    throw new NotFoundError('Template not found', 'TEMPLATE_NOT_FOUND');
  }

  // Optimize image (512x512 max, WebP 85%)
  const optimized = await imageOptimizerService.optimizeAvatar(buffer);

  // Save to disk
  const { url } = await fileStorageService.saveThumbnail(
    templateId,
    optimized,
    template.slug,
  );

  // Update database
  const updated = await templatesRepo.updateThumbnailUrl(templateId, url);

  logger.info({ templateId, thumbnailUrl: url }, '[TEMPLATES] Thumbnail uploaded');

  return sanitizeTemplate(updated);
}

async deleteThumbnail(templateId: string): Promise<void> {
  const template = await templatesRepo.findById(templateId);
  if (!template) {
    throw new NotFoundError('Template not found', 'TEMPLATE_NOT_FOUND');
  }

  if (!template.thumbnailUrl) {
    throw new BadRequestError('Template has no thumbnail', 'NO_THUMBNAIL');
  }

  // Delete from disk
  await fileStorageService.deleteThumbnail(templateId);

  // Clear database
  await templatesRepo.clearThumbnailUrl(templateId);

  logger.info({ templateId }, '[TEMPLATES] Thumbnail deleted');
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/templates/templates.service.ts
git commit -m "feat: add template thumbnail service methods"
```

---

### Task 5: Add template controller thumbnail handlers

**Files:**
- Modify: `server/src/modules/templates/templates.controller.ts`

- [ ] **Step 1: Add imports**

Update imports at the top of the file. After line 3, add:

```typescript
import { validateImageFile } from '@libs/storage/file-validator.js';
import { BadRequestError } from '@shared/errors/errors.js';
import { logger } from '@libs/logger.js';
```

- [ ] **Step 2: Add `uploadThumbnail` and `deleteThumbnail` methods**

Add these methods inside the `TemplatesController` class, after the `delete` method (after line 74):

```typescript
async uploadThumbnail(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { templateId } = request.params as TemplateIdParams;

  const data = await request.file();
  if (!data) {
    throw new BadRequestError('No file uploaded', 'NO_FILE');
  }

  const { buffer, mimeType, filename } = await validateImageFile(data);

  logger.info({
    msg: 'Template thumbnail upload request',
    templateId,
    filename,
    mimetype: mimeType,
    size: buffer.length,
  });

  const template = await templatesService.uploadThumbnail(templateId, buffer);

  reply.send(successResponse('Thumbnail uploaded successfully', template));
}

async deleteThumbnail(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { templateId } = request.params as TemplateIdParams;

  logger.info({ msg: 'Template thumbnail delete request', templateId });

  await templatesService.deleteThumbnail(templateId);

  reply.send(successResponse('Thumbnail deleted successfully', null));
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/templates/templates.controller.ts
git commit -m "feat: add template thumbnail controller handlers"
```

---

### Task 6: Add template thumbnail routes

**Files:**
- Modify: `server/src/modules/templates/templates.routes.ts`

- [ ] **Step 1: Add two new admin routes**

Add these routes at the end of the `templateRoutes` function, after the DELETE `/templates/:templateId` route (after line 114, before the closing `}`):

```typescript
// --- Admin Thumbnail Routes ---

/**
 * Upload template thumbnail
 *
 * POST /api/v1/templates/:templateId/thumbnail
 * Auth: Required (ADMIN)
 * Body: multipart/form-data with image file
 */
fastify.post('/templates/:templateId/thumbnail', {
  preValidation: [authenticate, authorize('ADMIN')],
  schema: {
    params: templateIdParamSchema,
  },
  config: {
    rateLimit: RATE_LIMITS.TEMPLATES_ADMIN,
  },
  handler: templatesController.uploadThumbnail.bind(templatesController),
});

/**
 * Delete template thumbnail
 *
 * DELETE /api/v1/templates/:templateId/thumbnail
 * Auth: Required (ADMIN)
 */
fastify.delete('/templates/:templateId/thumbnail', {
  preValidation: [authenticate, authorize('ADMIN')],
  schema: {
    params: templateIdParamSchema,
  },
  config: {
    rateLimit: RATE_LIMITS.TEMPLATES_ADMIN,
  },
  handler: templatesController.deleteThumbnail.bind(templatesController),
});
```

- [ ] **Step 2: Verify compilation**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Verify server starts**

Run: `cd server && npm run dev` (start and verify no startup errors, then stop)
Expected: Server starts without errors, file storage initializes with templates directory

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/templates/templates.routes.ts
git commit -m "feat: add template thumbnail upload and delete routes"
```

---

## Chunk 3: Postman Collection

### Task 7: Update Postman collection

**Files:**
- Modify: `server/postman/collection.json`

- [ ] **Step 1: Add thumbnail requests to Templates > Admin folder**

In `collection.json`, find the `Templates > Admin` item array (line 599, the `"item"` array inside the Admin folder). Add these two entries after the "Delete Template" entry (after line 675, before the closing `]` of the Admin items array):

```json
,
{
  "name": "Upload Thumbnail",
  "request": {
    "method": "POST",
    "header": [],
    "body": {
      "mode": "formdata",
      "formdata": [
        {
          "key": "file",
          "type": "file",
          "src": "",
          "description": "Thumbnail image (JPEG, PNG, WebP, or HEIC/HEIF, max 10MB)"
        }
      ]
    },
    "url": {
      "raw": "{{baseUrl}}/templates/{{templateId}}/thumbnail",
      "host": ["{{baseUrl}}"],
      "path": ["templates", "{{templateId}}", "thumbnail"]
    },
    "description": "Upload or replace a template's thumbnail image. Accepts JPEG, PNG, WebP, or HEIC/HEIF. Image is optimized to 512x512 max and converted to WebP."
  },
  "response": []
},
{
  "name": "Delete Thumbnail",
  "request": {
    "method": "DELETE",
    "header": [],
    "url": {
      "raw": "{{baseUrl}}/templates/{{templateId}}/thumbnail",
      "host": ["{{baseUrl}}"],
      "path": ["templates", "{{templateId}}", "thumbnail"]
    },
    "description": "Delete a template's thumbnail image."
  },
  "response": []
}
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('server/postman/collection.json', 'utf8')); console.log('Valid JSON')"`
Expected: "Valid JSON"

- [ ] **Step 3: Commit**

```bash
git add server/postman/collection.json
git commit -m "feat: add template thumbnail requests to Postman collection"
```

---

## Chunk 4: Manual Testing

### Task 8: End-to-end verification

- [ ] **Step 1: Start the server**

Run: `cd server && npm run dev`
Expected: Server starts, logs "File storage initialized"

- [ ] **Step 2: Login as admin via Postman**

POST `{{baseUrl}}/auth/login` with admin credentials to get authenticated cookies.

- [ ] **Step 3: Test thumbnail upload**

POST `{{baseUrl}}/templates/{{templateId}}/thumbnail` with a JPEG/PNG/WebP image file.
Expected: 200 response with template data including populated `thumbnailUrl` field like `/uploads/templates/{id}/thumbnail/{slug}-thumbnail.webp`

- [ ] **Step 4: Verify file exists on disk**

Check: `server/uploads/templates/{templateId}/thumbnail/{slug}-thumbnail.webp` exists.

- [ ] **Step 5: Verify thumbnail is accessible via URL**

GET `http://localhost:8000/uploads/templates/{templateId}/thumbnail/{slug}-thumbnail.webp`
Expected: Image served correctly

- [ ] **Step 6: Test thumbnail replacement**

POST the same endpoint with a different image.
Expected: 200, old file overwritten, same URL returned

- [ ] **Step 7: Test thumbnail delete**

DELETE `{{baseUrl}}/templates/{{templateId}}/thumbnail`
Expected: 200, `thumbnailUrl` is null in subsequent GET, thumbnail directory removed from disk

- [ ] **Step 8: Test error cases**

- DELETE thumbnail when none exists → 400 `NO_THUMBNAIL`
- POST with invalid file type → 422 `INVALID_FILE_TYPE`
- POST/DELETE with non-existent templateId → 404 `TEMPLATE_NOT_FOUND`
- POST/DELETE without admin auth → 403 `FORBIDDEN`

- [ ] **Step 9: Verify list endpoint still returns thumbnailUrl**

GET `{{baseUrl}}/templates` — templates with uploaded thumbnails should show `thumbnailUrl`, others show `null`.
