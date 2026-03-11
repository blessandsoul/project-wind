/**
 * File Upload Validator
 *
 * Validates uploaded files for security and compliance with upload constraints.
 * Uses magic bytes (file signatures) for reliable MIME type detection instead
 * of trusting the client-reported Content-Type header.
 */

import type { MultipartFile } from '@fastify/multipart';
import { ValidationError } from '@shared/errors/errors.js';
import { env } from '@config/env.js';
import path from 'path';

/**
 * File upload constants and constraints
 */
export const FILE_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: env.MAX_FILE_SIZE_MB * 1024 * 1024, // ENV-configurable (default 10MB)
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'] as const,
  AVATAR_MAX_DIMENSION: 512, // pixels
} as const;

/** Dangerous executable extensions to block regardless of MIME type */
const DANGEROUS_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];

/**
 * Validates an uploaded image file using magic bytes detection.
 *
 * Reads the file buffer, detects the real MIME type from file content,
 * and validates against the allowed list. This is reliable regardless
 * of what Content-Type the client sends.
 *
 * @param file - Fastify multipart file object
 * @returns Object with validated buffer, detected mimeType, and filename
 * @throws ValidationError if file is invalid
 *
 * @example
 * ```typescript
 * const file = await request.file();
 * const { buffer, mimeType, filename } = await validateImageFile(file);
 * ```
 */
export async function validateImageFile(file: MultipartFile): Promise<{
  buffer: Buffer;
  mimeType: string;
  filename: string;
}> {
  // Validate file exists
  if (!file) {
    throw new ValidationError('No file was uploaded', 'FILE_REQUIRED');
  }

  // Prevent executable files (check extension early, before reading buffer)
  const lowerFilename = file.filename.toLowerCase();
  if (DANGEROUS_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext))) {
    throw new ValidationError('Executable files are not allowed', 'DANGEROUS_FILE');
  }

  // Validate file extension
  const extension = path.extname(file.filename).toLowerCase();
  if (!(FILE_UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new ValidationError(
      `Invalid file extension. Allowed extensions: ${FILE_UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS.join(', ')}`,
      'INVALID_FILE_EXTENSION',
    );
  }

  // Read buffer
  const buffer = await file.toBuffer();

  // Validate buffer is not empty
  if (buffer.length === 0) {
    throw new ValidationError('Uploaded file is empty', 'FILE_EMPTY');
  }

  // Validate file size
  if (buffer.length > FILE_UPLOAD_CONSTANTS.MAX_FILE_SIZE) {
    const maxSizeMB = FILE_UPLOAD_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024);
    throw new ValidationError(
      `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      'FILE_TOO_LARGE',
    );
  }

  // Detect real MIME type from magic bytes (not the client-reported header)
  const { fileTypeFromBuffer } = await import('file-type');
  const detected = await fileTypeFromBuffer(buffer);

  const detectedMime = detected?.mime;

  if (!detectedMime || !(FILE_UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES as readonly string[]).includes(detectedMime)) {
    throw new ValidationError(
      `Invalid file type. Allowed types: ${FILE_UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES.join(', ')}`,
      'INVALID_FILE_TYPE',
    );
  }

  return {
    buffer,
    mimeType: detectedMime,
    filename: file.filename,
  };
}
