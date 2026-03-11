import type { FastifyInstance } from 'fastify';
import { authenticate } from '@libs/auth.js';
import { RATE_LIMITS } from '@config/rate-limit.config.js';
import { generationsController } from './generations.controller.js';
import { listGenerationsQuerySchema, generationIdParamSchema } from './generations.schemas.js';

export async function generationRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Create a new image generation (upload image + select template)
   *
   * POST /api/v1/generations
   * Auth: Required
   * Content-Type: multipart/form-data
   * Body: { file: File, templateId: string, aiModelId: string }
   */
  fastify.post('/generations', {
    preValidation: [authenticate],
    config: {
      rateLimit: RATE_LIMITS.GENERATIONS_CREATE,
    },
    handler: generationsController.create.bind(generationsController),
  });

  /**
   * Create a new video generation (upload image + select video template)
   *
   * POST /api/v1/generations/video
   * Auth: Required
   * Content-Type: multipart/form-data
   * Body: { file: File, templateId: string, aiModelId: string, durationSeconds: 4|6|8 }
   * Returns: 202 Accepted with PROCESSING generation
   */
  fastify.post('/generations/video', {
    preValidation: [authenticate],
    config: {
      rateLimit: RATE_LIMITS.GENERATIONS_VIDEO_CREATE,
    },
    handler: generationsController.createVideo.bind(generationsController),
  });

  /**
   * List user's generations (paginated)
   *
   * GET /api/v1/generations
   * Auth: Required
   * Query: { page?, limit?, status? }
   */
  fastify.get('/generations', {
    preValidation: [authenticate],
    schema: {
      querystring: listGenerationsQuerySchema,
    },
    config: {
      rateLimit: RATE_LIMITS.GENERATIONS_LIST,
    },
    handler: generationsController.list.bind(generationsController),
  });

  /**
   * Get generation details
   *
   * GET /api/v1/generations/:generationId
   * Auth: Required (owner only)
   */
  fastify.get('/generations/:generationId', {
    preValidation: [authenticate],
    schema: {
      params: generationIdParamSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.GENERATIONS_GET,
    },
    handler: generationsController.getById.bind(generationsController),
  });

  /**
   * Delete a generation
   *
   * DELETE /api/v1/generations/:generationId
   * Auth: Required (owner only)
   */
  fastify.delete('/generations/:generationId', {
    preValidation: [authenticate],
    schema: {
      params: generationIdParamSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.GENERATIONS_DELETE,
    },
    handler: generationsController.delete.bind(generationsController),
  });
}
