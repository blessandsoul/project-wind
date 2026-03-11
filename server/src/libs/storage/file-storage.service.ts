/**
 * File Storage Service
 *
 * Handles local file system operations for user-uploaded files.
 * Directory structure: uploads/users/{userId}/<media-type>/
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '@libs/logger.js';
import { InternalError } from '@shared/errors/errors.js';
import { generateAvatarFilename, generateThumbnailFilename } from './filename-sanitizer.js';

/**
 * File Storage Service
 *
 * Manages local file storage with per-user directories and SEO-friendly naming.
 * All user media lives under uploads/users/{userId}/ for easy per-user cleanup.
 */
class FileStorageService {
  private readonly uploadDir: string;
  private readonly usersDir: string;
  private readonly generationsDir: string;
  private readonly templatesDir: string;

  constructor() {
    // Base upload directory: server/uploads
    this.uploadDir = path.join(process.cwd(), 'uploads');
    // Users media directory: server/uploads/users
    this.usersDir = path.join(this.uploadDir, 'users');
    // Generations media directory: server/uploads/generations
    this.generationsDir = path.join(this.uploadDir, 'generations');
    // Templates media directory: server/uploads/templates
    this.templatesDir = path.join(this.uploadDir, 'templates');
  }

  /**
   * Gets the base directory for a user's media
   */
  private getUserDir(userId: string): string {
    return path.join(this.usersDir, userId);
  }

  /**
   * Gets the avatar directory for a user
   */
  private getUserAvatarDir(userId: string): string {
    return path.join(this.getUserDir(userId), 'avatar');
  }

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

  /**
   * Saves an avatar image to user-specific directory
   *
   * Process:
   * 1. Create user avatar directory if it doesn't exist
   * 2. Generate SEO-friendly filename
   * 3. Save buffer to file (overwrites existing avatar)
   * 4. Return filename and public URL
   *
   * @param userId - User's unique ID
   * @param buffer - Optimized image buffer
   * @param firstName - User's first name (for SEO filename)
   * @param lastName - User's last name (for SEO filename)
   * @returns Filename and URL of saved avatar
   *
   * @example
   * ```typescript
   * const { filename, url } = await fileStorageService.saveAvatar(
   *   userId,
   *   imageBuffer,
   *   'John',
   *   'Doe'
   * );
   * // filename: "john-doe-avatar.webp"
   * // url: "/uploads/users/{userId}/avatar/john-doe-avatar.webp"
   * ```
   */
  async saveAvatar(
    userId: string,
    buffer: Buffer,
    firstName: string,
    lastName: string
  ): Promise<{ filename: string; url: string }> {
    try {
      // Ensure user's avatar directory exists
      const avatarDir = this.getUserAvatarDir(userId);
      await this.ensureDirectoryExists(avatarDir);

      // Generate SEO-friendly filename
      const filename = generateAvatarFilename(firstName, lastName, 'webp');
      const filePath = path.join(avatarDir, filename);

      // Write file to disk (overwrites existing)
      await fs.writeFile(filePath, buffer);

      // Generate public URL
      const url = `/uploads/users/${userId}/avatar/${filename}`;

      logger.info({
        msg: 'Avatar saved successfully',
        userId,
        filename,
        fileSize: buffer.length,
      });

      return { filename, url };
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to save avatar', userId });
      throw new InternalError('Failed to save avatar file', 'FILE_SAVE_FAILED');
    }
  }

  /**
   * Deletes a user's avatar directory and all contents
   *
   * @param userId - User's unique ID
   * @throws InternalError if deletion fails
   *
   * @example
   * ```typescript
   * await fileStorageService.deleteAvatar(userId);
   * ```
   */
  async deleteAvatar(userId: string): Promise<void> {
    try {
      const avatarDir = this.getUserAvatarDir(userId);

      // Check if directory exists
      const exists = await this.directoryExists(avatarDir);
      if (!exists) {
        logger.info({ msg: 'Avatar directory does not exist, nothing to delete', userId });
        return;
      }

      // Delete avatar directory and contents
      await fs.rm(avatarDir, { recursive: true, force: true });

      logger.info({ msg: 'Avatar deleted successfully', userId });
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to delete avatar', userId });
      throw new InternalError('Failed to delete avatar file', 'FILE_DELETE_FAILED');
    }
  }

  /**
   * Deletes all media for a user (entire user directory)
   *
   * Used by the cleanup job when permanently purging deleted accounts.
   * No-op if the user directory doesn't exist.
   *
   * @param userId - User's unique ID
   *
   * @example
   * ```typescript
   * await fileStorageService.deleteUserMedia(userId);
   * ```
   */
  async deleteUserMedia(userId: string): Promise<void> {
    try {
      const userDir = this.getUserDir(userId);

      const exists = await this.directoryExists(userDir);
      if (!exists) {
        return;
      }

      await fs.rm(userDir, { recursive: true, force: true });

      logger.info({ msg: 'User media deleted successfully', userId });
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to delete user media', userId });
      throw new InternalError('Failed to delete user media', 'FILE_DELETE_FAILED');
    }
  }

  /**
   * Gets the full file system path for an avatar
   *
   * @param userId - User's unique ID
   * @param filename - Avatar filename
   * @returns Absolute file path
   */
  getAvatarPath(userId: string, filename: string): string {
    return path.join(this.getUserAvatarDir(userId), filename);
  }

  /**
   * Gets the public URL for an avatar
   *
   * @param userId - User's unique ID
   * @param filename - Avatar filename
   * @returns Public URL path
   */
  getAvatarUrl(userId: string, filename: string): string {
    return `/uploads/users/${userId}/avatar/${filename}`;
  }

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

  // ─── Generation File Operations ──────────────────────────────

  /**
   * Gets the base directory for a generation's files
   */
  private getGenerationDir(generationId: string): string {
    return path.join(this.generationsDir, generationId);
  }

  /**
   * Gets the input directory for a generation
   */
  private getGenerationInputDir(generationId: string): string {
    return path.join(this.getGenerationDir(generationId), 'input');
  }

  /**
   * Gets the output directory for a generation
   */
  private getGenerationOutputDir(generationId: string): string {
    return path.join(this.getGenerationDir(generationId), 'output');
  }

  /**
   * Saves the user's uploaded input image for a generation
   *
   * @param generationId - Generation's unique ID
   * @param buffer - Image buffer
   * @param originalFilename - Original filename from upload
   * @returns Filename and public URL
   */
  async saveGenerationInput(
    generationId: string,
    buffer: Buffer,
    originalFilename: string,
  ): Promise<{ filename: string; url: string }> {
    try {
      const inputDir = this.getGenerationInputDir(generationId);
      await this.ensureDirectoryExists(inputDir);

      // Keep original extension or default to .jpg
      const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
      const filename = `input${ext}`;
      const filePath = path.join(inputDir, filename);

      await fs.writeFile(filePath, buffer);

      const url = `/uploads/generations/${generationId}/input/${filename}`;

      logger.info({
        msg: 'Generation input saved',
        generationId,
        filename,
        fileSize: buffer.length,
      });

      return { filename, url };
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to save generation input', generationId });
      throw new InternalError('Failed to save generation input file', 'FILE_SAVE_FAILED');
    }
  }

  /**
   * Saves the AI-generated output image for a generation
   *
   * @param generationId - Generation's unique ID
   * @param buffer - Optimized image buffer (WebP)
   * @returns Filename and public URL
   */
  async saveGenerationOutput(
    generationId: string,
    buffer: Buffer,
  ): Promise<{ filename: string; url: string }> {
    try {
      const outputDir = this.getGenerationOutputDir(generationId);
      await this.ensureDirectoryExists(outputDir);

      const filename = 'result.webp';
      const filePath = path.join(outputDir, filename);

      await fs.writeFile(filePath, buffer);

      const url = `/uploads/generations/${generationId}/output/${filename}`;

      logger.info({
        msg: 'Generation output saved',
        generationId,
        filename,
        fileSize: buffer.length,
      });

      return { filename, url };
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to save generation output', generationId });
      throw new InternalError('Failed to save generation output file', 'FILE_SAVE_FAILED');
    }
  }

  /**
   * Saves the AI-generated output video for a generation
   *
   * @param generationId - Generation's unique ID
   * @param buffer - Raw video buffer (MP4)
   * @returns Filename and public URL
   */
  async saveGenerationVideoOutput(
    generationId: string,
    buffer: Buffer,
  ): Promise<{ filename: string; url: string }> {
    try {
      const outputDir = this.getGenerationOutputDir(generationId);
      await this.ensureDirectoryExists(outputDir);

      const filename = 'result.mp4';
      const filePath = path.join(outputDir, filename);

      await fs.writeFile(filePath, buffer);

      const url = `/uploads/generations/${generationId}/output/${filename}`;

      logger.info({
        msg: 'Generation video output saved',
        generationId,
        filename,
        fileSize: buffer.length,
      });

      return { filename, url };
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to save generation video output', generationId });
      throw new InternalError('Failed to save generation video output file', 'FILE_SAVE_FAILED');
    }
  }

  /**
   * Deletes all files for a generation (input + output)
   *
   * @param generationId - Generation's unique ID
   */
  async deleteGeneration(generationId: string): Promise<void> {
    try {
      const generationDir = this.getGenerationDir(generationId);

      const exists = await this.directoryExists(generationDir);
      if (!exists) {
        return;
      }

      await fs.rm(generationDir, { recursive: true, force: true });

      logger.info({ msg: 'Generation files deleted', generationId });
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to delete generation files', generationId });
      throw new InternalError('Failed to delete generation files', 'FILE_DELETE_FAILED');
    }
  }

  // ─── Utility Methods ───────────────────────────────────────

  /**
   * Checks if a file exists
   *
   * @param filePath - Full file path
   * @returns True if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensures a directory exists, creates it if not
   *
   * @param dirPath - Directory path
   * @private
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(dirPath, { recursive: true });
      logger.info({ msg: 'Created directory', dirPath });
    }
  }

  /**
   * Checks if a directory exists
   *
   * @param dirPath - Directory path
   * @returns True if directory exists
   * @private
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Initializes the upload directory structure
   *
   * Creates base uploads directory and users subdirectory if they don't exist.
   * Should be called at application startup.
   */
  async initialize(): Promise<void> {
    try {
      await this.ensureDirectoryExists(this.uploadDir);
      await this.ensureDirectoryExists(this.usersDir);
      await this.ensureDirectoryExists(this.generationsDir);
      await this.ensureDirectoryExists(this.templatesDir);
      logger.info({ msg: 'File storage initialized', uploadDir: this.uploadDir });
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to initialize file storage' });
      throw new InternalError('Failed to initialize file storage', 'STORAGE_INIT_FAILED');
    }
  }
}

// Export singleton instance
export const fileStorageService = new FileStorageService();
