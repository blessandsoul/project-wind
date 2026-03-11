import { logger } from '@libs/logger.js';
import { NotFoundError, ConflictError, BadRequestError } from '@shared/errors/errors.js';
import { imageOptimizerService } from '@libs/storage/image-optimizer.service.js';
import { fileStorageService } from '@libs/storage/file-storage.service.js';
import * as templatesRepo from './templates.repo.js';
import type { CreateTemplateInput, UpdateTemplateInput } from './templates.schemas.js';
import type { GenerationType } from '@prisma/client';

interface SanitizedTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  type: GenerationType;
  promptTemplate: string;
  providerKey: string | null;
  creditCost: number;
  thumbnailUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function sanitizeTemplate(template: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  type: GenerationType;
  promptTemplate: string;
  providerKey: string | null;
  creditCost: number;
  thumbnailUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): SanitizedTemplate {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    description: template.description,
    category: template.category,
    type: template.type,
    promptTemplate: template.promptTemplate,
    providerKey: template.providerKey,
    creditCost: template.creditCost,
    thumbnailUrl: template.thumbnailUrl,
    isActive: template.isActive,
    sortOrder: template.sortOrder,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

class TemplatesService {
  async listTemplates(
    filters: { category?: string; search?: string; type?: GenerationType },
    page: number,
    limit: number,
  ): Promise<{ items: SanitizedTemplate[]; totalItems: number }> {
    const [templates, totalItems] = await Promise.all([
      templatesRepo.findAll({ ...filters, activeOnly: true }, page, limit),
      templatesRepo.countAll({ ...filters, activeOnly: true }),
    ]);

    return {
      items: templates.map(sanitizeTemplate),
      totalItems,
    };
  }

  async getTemplate(id: string): Promise<SanitizedTemplate> {
    const template = await templatesRepo.findById(id);
    if (!template) {
      throw new NotFoundError('Template not found', 'TEMPLATE_NOT_FOUND');
    }
    return sanitizeTemplate(template);
  }

  async getTemplateBySlug(slug: string): Promise<SanitizedTemplate> {
    const template = await templatesRepo.findBySlug(slug);
    if (!template) {
      throw new NotFoundError('Template not found', 'TEMPLATE_NOT_FOUND');
    }
    return sanitizeTemplate(template);
  }

  async createTemplate(input: CreateTemplateInput): Promise<SanitizedTemplate> {
    // Generate slug if not provided
    const slug = input.slug || generateSlug(input.name);

    // Check slug uniqueness
    const existing = await templatesRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictError('A template with this slug already exists', 'SLUG_ALREADY_EXISTS');
    }

    const template = await templatesRepo.create({
      name: input.name,
      slug,
      description: input.description,
      category: input.category,
      type: input.type,
      promptTemplate: input.promptTemplate,
      providerKey: input.providerKey,
      creditCost: input.creditCost,
      sortOrder: input.sortOrder,
    });

    logger.info({ templateId: template.id, slug }, '[TEMPLATES] Template created');

    return sanitizeTemplate(template);
  }

  async updateTemplate(id: string, input: UpdateTemplateInput): Promise<SanitizedTemplate> {
    const existing = await templatesRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Template not found', 'TEMPLATE_NOT_FOUND');
    }

    // Check slug uniqueness if changed
    if (input.slug && input.slug !== existing.slug) {
      const slugConflict = await templatesRepo.findBySlug(input.slug);
      if (slugConflict) {
        throw new ConflictError('A template with this slug already exists', 'SLUG_ALREADY_EXISTS');
      }
    }

    const template = await templatesRepo.update(id, input);

    logger.info({ templateId: id }, '[TEMPLATES] Template updated');

    return sanitizeTemplate(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    const existing = await templatesRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Template not found', 'TEMPLATE_NOT_FOUND');
    }

    await templatesRepo.deactivate(id);

    logger.info({ templateId: id }, '[TEMPLATES] Template deactivated');
  }

  async getCategories(): Promise<string[]> {
    return templatesRepo.getDistinctCategories();
  }

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

  interpolatePrompt(
    promptTemplate: string,
    variables?: Record<string, string>,
  ): string {
    if (!variables) {
      return promptTemplate;
    }

    let result = promptTemplate;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    return result;
  }
}

export const templatesService = new TemplatesService();
