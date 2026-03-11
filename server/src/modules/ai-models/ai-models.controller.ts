import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@shared/responses/successResponse.js';
import { paginatedResponse } from '@shared/responses/paginatedResponse.js';
import { aiModelsService } from './ai-models.service.js';
import type {
  ListAiModelsQuery,
  AiModelIdParams,
  CreateAiModelInput,
  UpdateAiModelInput,
} from './ai-models.schemas.js';

class AiModelsController {
  async list(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { page, limit, providerKey, type } = request.query as ListAiModelsQuery;

    const { items, totalItems } = await aiModelsService.listModels(
      { providerKey, type },
      page,
      limit,
    );

    reply.send(
      paginatedResponse('AI models retrieved', items, page, limit, totalItems),
    );
  }

  async listAll(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { page, limit, providerKey, type } = request.query as ListAiModelsQuery;

    const { items, totalItems } = await aiModelsService.listAllModels(
      { providerKey, type },
      page,
      limit,
    );

    reply.send(
      paginatedResponse('All AI models retrieved', items, page, limit, totalItems),
    );
  }

  async getById(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { aiModelId } = request.params as AiModelIdParams;
    const model = await aiModelsService.getModel(aiModelId);
    reply.send(successResponse('AI model retrieved', model));
  }

  async create(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const model = await aiModelsService.createModel(request.body as CreateAiModelInput);
    reply.status(201).send(successResponse('AI model created successfully', model));
  }

  async update(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { aiModelId } = request.params as AiModelIdParams;
    const model = await aiModelsService.updateModel(
      aiModelId,
      request.body as UpdateAiModelInput,
    );
    reply.send(successResponse('AI model updated successfully', model));
  }

  async delete(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { aiModelId } = request.params as AiModelIdParams;
    await aiModelsService.deleteModel(aiModelId);
    reply.send(successResponse('AI model deactivated successfully', null));
  }
}

export const aiModelsController = new AiModelsController();
