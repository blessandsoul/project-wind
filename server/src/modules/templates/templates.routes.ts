import type { FastifyInstance } from 'fastify';
import { authenticate, authorize } from '@libs/auth.js';
import { RATE_LIMITS } from '@config/rate-limit.config.js';
import { templatesController } from './templates.controller.js';
import {
  listTemplatesQuerySchema,
  templateIdParamSchema,
  createTemplateSchema,
  updateTemplateSchema,
} from './templates.schemas.js';

export async function templateRoutes(fastify: FastifyInstance): Promise<void> {
  // --- Public Routes ---

  /**
   * List active templates (paginated)
   *
   * GET /api/v1/templates
   * Auth: Not required
   * Query: { page?, limit?, category?, search? }
   */
  fastify.get('/templates', {
    schema: {
      querystring: listTemplatesQuerySchema,
    },
    config: {
      rateLimit: RATE_LIMITS.TEMPLATES_LIST,
    },
    handler: templatesController.list.bind(templatesController),
  });

  /**
   * Get distinct template categories
   *
   * GET /api/v1/templates/categories
   * Auth: Not required
   */
  fastify.get('/templates/categories', {
    config: {
      rateLimit: RATE_LIMITS.TEMPLATES_CATEGORIES,
    },
    handler: templatesController.getCategories.bind(templatesController),
  });

  /**
   * Get template by ID
   *
   * GET /api/v1/templates/:templateId
   * Auth: Not required
   */
  fastify.get('/templates/:templateId', {
    schema: {
      params: templateIdParamSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.TEMPLATES_GET,
    },
    handler: templatesController.getById.bind(templatesController),
  });

  // --- Admin Routes ---

  /**
   * Create template
   *
   * POST /api/v1/templates
   * Auth: Required (ADMIN)
   * Body: { name, slug?, description?, category, promptTemplate, providerKey?, creditCost?, sortOrder? }
   */
  fastify.post('/templates', {
    preValidation: [authenticate, authorize('ADMIN')],
    schema: {
      body: createTemplateSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.TEMPLATES_ADMIN,
    },
    handler: templatesController.create.bind(templatesController),
  });

  /**
   * Update template
   *
   * PATCH /api/v1/templates/:templateId
   * Auth: Required (ADMIN)
   */
  fastify.patch('/templates/:templateId', {
    preValidation: [authenticate, authorize('ADMIN')],
    schema: {
      params: templateIdParamSchema,
      body: updateTemplateSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.TEMPLATES_ADMIN,
    },
    handler: templatesController.update.bind(templatesController),
  });

  /**
   * Delete (deactivate) template
   *
   * DELETE /api/v1/templates/:templateId
   * Auth: Required (ADMIN)
   */
  fastify.delete('/templates/:templateId', {
    preValidation: [authenticate, authorize('ADMIN')],
    schema: {
      params: templateIdParamSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.TEMPLATES_ADMIN,
    },
    handler: templatesController.delete.bind(templatesController),
  });

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
}
