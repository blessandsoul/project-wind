import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@shared/responses/successResponse.js';
import { paginatedResponse } from '@shared/responses/paginatedResponse.js';
import { BadRequestError } from '@shared/errors/errors.js';
import { validateImageFile } from '@libs/storage/file-validator.js';
import { generationsService } from './generations.service.js';
import { createGenerationFieldsSchema, createVideoGenerationFieldsSchema } from './generations.schemas.js';
import type { ListGenerationsQuery, GenerationIdParams } from './generations.schemas.js';

class GenerationsController {
  async create(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const data = await request.file();

    if (!data) {
      throw new BadRequestError('No file uploaded', 'NO_FILE');
    }

    // Validate file (magic bytes detection, extension, size)
    const { buffer, mimeType, filename } = await validateImageFile(data);

    // Extract templateId and aiModelId from multipart fields
    const templateIdField = data.fields.templateId;
    const templateIdValue = templateIdField && 'value' in templateIdField
      ? (templateIdField as { value: string }).value
      : undefined;

    const aiModelIdField = data.fields.aiModelId;
    const aiModelIdValue = aiModelIdField && 'value' in aiModelIdField
      ? (aiModelIdField as { value: string }).value
      : undefined;

    if (!templateIdValue) {
      throw new BadRequestError('templateId is required', 'TEMPLATE_ID_REQUIRED');
    }

    if (!aiModelIdValue) {
      throw new BadRequestError('aiModelId is required', 'AI_MODEL_ID_REQUIRED');
    }

    // Validate with Zod
    const parsed = createGenerationFieldsSchema.safeParse({
      templateId: templateIdValue,
      aiModelId: aiModelIdValue,
    });
    if (!parsed.success) {
      throw new BadRequestError('Invalid field format', 'INVALID_FIELDS');
    }

    const userId = request.user.userId;
    const generation = await generationsService.createGeneration(
      userId,
      parsed.data.templateId,
      parsed.data.aiModelId,
      buffer,
      filename,
      mimeType,
    );

    reply.status(201).send(
      successResponse('Image generated successfully', generation),
    );
  }

  async createVideo(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const data = await request.file();

    if (!data) {
      throw new BadRequestError('No file uploaded', 'NO_FILE');
    }

    // Validate file (magic bytes detection, extension, size)
    const { buffer, mimeType, filename } = await validateImageFile(data);

    // Extract fields from multipart
    const templateIdField = data.fields.templateId;
    const templateIdValue = templateIdField && 'value' in templateIdField
      ? (templateIdField as { value: string }).value
      : undefined;

    const aiModelIdField = data.fields.aiModelId;
    const aiModelIdValue = aiModelIdField && 'value' in aiModelIdField
      ? (aiModelIdField as { value: string }).value
      : undefined;

    const durationField = data.fields.durationSeconds;
    const durationValue = durationField && 'value' in durationField
      ? (durationField as { value: string }).value
      : undefined;

    if (!templateIdValue) {
      throw new BadRequestError('templateId is required', 'TEMPLATE_ID_REQUIRED');
    }

    if (!aiModelIdValue) {
      throw new BadRequestError('aiModelId is required', 'AI_MODEL_ID_REQUIRED');
    }

    if (!durationValue) {
      throw new BadRequestError('durationSeconds is required', 'DURATION_REQUIRED');
    }

    // Validate with Zod
    const parsed = createVideoGenerationFieldsSchema.safeParse({
      templateId: templateIdValue,
      aiModelId: aiModelIdValue,
      durationSeconds: durationValue,
    });
    if (!parsed.success) {
      throw new BadRequestError('Invalid field format', 'INVALID_FIELDS');
    }

    const userId = request.user.userId;
    const generation = await generationsService.createVideoGeneration(
      userId,
      parsed.data.templateId,
      parsed.data.aiModelId,
      parsed.data.durationSeconds as 4 | 6 | 8,
      buffer,
      filename,
      mimeType,
    );

    reply.status(202).send(
      successResponse('Video generation started', generation),
    );
  }

  async list(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = request.user.userId;
    const { page, limit, status, type } = request.query as ListGenerationsQuery;

    const { items, totalItems } = await generationsService.listGenerations(
      userId,
      { status, type },
      page,
      limit,
    );

    reply.send(
      paginatedResponse('Generations retrieved', items, page, limit, totalItems),
    );
  }

  async getById(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = request.user.userId;
    const { generationId } = request.params as GenerationIdParams;
    const generation = await generationsService.getGeneration(generationId, userId);

    reply.send(successResponse('Generation retrieved', generation));
  }

  async delete(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = request.user.userId;
    const { generationId } = request.params as GenerationIdParams;
    await generationsService.deleteGeneration(generationId, userId);
    reply.send(successResponse('Generation deleted successfully', null));
  }
}

export const generationsController = new GenerationsController();
