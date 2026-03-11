import type { FastifyInstance } from 'fastify';
import { authenticate, authorize } from '@libs/auth.js';
import { RATE_LIMITS } from '@config/rate-limit.config.js';
import { aiModelsController } from './ai-models.controller.js';
import {
  listAiModelsQuerySchema,
  aiModelIdParamSchema,
  createAiModelSchema,
  updateAiModelSchema,
} from './ai-models.schemas.js';

export async function aiModelRoutes(fastify: FastifyInstance): Promise<void> {
  // --- Public Routes ---

  /**
   * List active AI models (paginated)
   *
   * GET /api/v1/ai-models
   * Auth: Not required
   * Query: { page?, limit?, providerKey? }
   */
  fastify.get('/ai-models', {
    schema: {
      querystring: listAiModelsQuerySchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AI_MODELS_LIST,
    },
    handler: aiModelsController.list.bind(aiModelsController),
  });

  /**
   * Get AI model by ID
   *
   * GET /api/v1/ai-models/:aiModelId
   * Auth: Not required
   */
  fastify.get('/ai-models/:aiModelId', {
    schema: {
      params: aiModelIdParamSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AI_MODELS_GET,
    },
    handler: aiModelsController.getById.bind(aiModelsController),
  });

  // --- Admin Routes ---

  /**
   * List all AI models including inactive (admin)
   *
   * GET /api/v1/ai-models/admin
   * Auth: Required (ADMIN)
   * Query: { page?, limit?, providerKey? }
   */
  fastify.get('/ai-models/admin', {
    preValidation: [authenticate, authorize('ADMIN')],
    schema: {
      querystring: listAiModelsQuerySchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AI_MODELS_ADMIN,
    },
    handler: aiModelsController.listAll.bind(aiModelsController),
  });

  /**
   * Create AI model
   *
   * POST /api/v1/ai-models
   * Auth: Required (ADMIN)
   * Body: { providerKey, modelId, name, description?, creditCost?, isActive?, sortOrder? }
   */
  fastify.post('/ai-models', {
    preValidation: [authenticate, authorize('ADMIN')],
    schema: {
      body: createAiModelSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AI_MODELS_ADMIN,
    },
    handler: aiModelsController.create.bind(aiModelsController),
  });

  /**
   * Update AI model
   *
   * PATCH /api/v1/ai-models/:aiModelId
   * Auth: Required (ADMIN)
   */
  fastify.patch('/ai-models/:aiModelId', {
    preValidation: [authenticate, authorize('ADMIN')],
    schema: {
      params: aiModelIdParamSchema,
      body: updateAiModelSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AI_MODELS_ADMIN,
    },
    handler: aiModelsController.update.bind(aiModelsController),
  });

  /**
   * Delete (deactivate) AI model
   *
   * DELETE /api/v1/ai-models/:aiModelId
   * Auth: Required (ADMIN)
   */
  fastify.delete('/ai-models/:aiModelId', {
    preValidation: [authenticate, authorize('ADMIN')],
    schema: {
      params: aiModelIdParamSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AI_MODELS_ADMIN,
    },
    handler: aiModelsController.delete.bind(aiModelsController),
  });
}
