import { logger } from '@libs/logger.js';
import { aiProviderRegistry } from '@libs/ai/index.js';
import { NotFoundError, ConflictError, BadRequestError } from '@shared/errors/errors.js';
import * as aiModelsRepo from './ai-models.repo.js';
import type { CreateAiModelInput, UpdateAiModelInput } from './ai-models.schemas.js';
import type { GenerationType } from '@prisma/client';

interface SanitizedAiModel {
  id: string;
  providerKey: string;
  modelId: string;
  name: string;
  description: string | null;
  type: GenerationType;
  creditCost: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function sanitizeAiModel(model: {
  id: string;
  providerKey: string;
  modelId: string;
  name: string;
  description: string | null;
  type: GenerationType;
  creditCost: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): SanitizedAiModel {
  return {
    id: model.id,
    providerKey: model.providerKey,
    modelId: model.modelId,
    name: model.name,
    description: model.description,
    type: model.type,
    creditCost: model.creditCost,
    isActive: model.isActive,
    sortOrder: model.sortOrder,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

class AiModelsService {
  async listModels(
    filters: { providerKey?: string; type?: GenerationType },
    page: number,
    limit: number,
  ): Promise<{ items: SanitizedAiModel[]; totalItems: number }> {
    const [models, totalItems] = await Promise.all([
      aiModelsRepo.findAll({ ...filters, activeOnly: true }, page, limit),
      aiModelsRepo.countAll({ ...filters, activeOnly: true }),
    ]);

    return {
      items: models.map(sanitizeAiModel),
      totalItems,
    };
  }

  async listAllModels(
    filters: { providerKey?: string; type?: GenerationType },
    page: number,
    limit: number,
  ): Promise<{ items: SanitizedAiModel[]; totalItems: number }> {
    const [models, totalItems] = await Promise.all([
      aiModelsRepo.findAll({ ...filters, activeOnly: false }, page, limit),
      aiModelsRepo.countAll({ ...filters, activeOnly: false }),
    ]);

    return {
      items: models.map(sanitizeAiModel),
      totalItems,
    };
  }

  async getModel(id: string): Promise<SanitizedAiModel> {
    const model = await aiModelsRepo.findById(id);
    if (!model) {
      throw new NotFoundError('AI model not found', 'AI_MODEL_NOT_FOUND');
    }
    return sanitizeAiModel(model);
  }

  async getModelRaw(id: string): Promise<{
    id: string;
    providerKey: string;
    modelId: string;
    name: string;
    type: GenerationType;
    creditCost: number;
    isActive: boolean;
  }> {
    const model = await aiModelsRepo.findById(id);
    if (!model) {
      throw new NotFoundError('AI model not found', 'AI_MODEL_NOT_FOUND');
    }
    return model;
  }

  async createModel(input: CreateAiModelInput): Promise<SanitizedAiModel> {
    // Validate provider exists in registry (image or video)
    const isImageProvider = aiProviderRegistry.has(input.providerKey);
    const isVideoProvider = aiProviderRegistry.hasVideo(input.providerKey);
    if (!isImageProvider && !isVideoProvider) {
      throw new BadRequestError(
        `AI provider '${input.providerKey}' is not available`,
        'INVALID_PROVIDER_KEY',
      );
    }

    // Check unique constraint: providerKey + modelId
    const existing = await aiModelsRepo.findAll(
      { providerKey: input.providerKey, activeOnly: false },
      1,
      1000,
    );
    const duplicate = existing.find((m) => m.modelId === input.modelId);
    if (duplicate) {
      throw new ConflictError(
        'A model with this provider key and model ID already exists',
        'AI_MODEL_ALREADY_EXISTS',
      );
    }

    const model = await aiModelsRepo.create({
      providerKey: input.providerKey,
      modelId: input.modelId,
      name: input.name,
      description: input.description,
      type: input.type,
      creditCost: input.creditCost,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    });

    logger.info({ aiModelId: model.id, modelId: model.modelId }, '[AI_MODELS] AI model created');

    return sanitizeAiModel(model);
  }

  async updateModel(id: string, input: UpdateAiModelInput): Promise<SanitizedAiModel> {
    const existing = await aiModelsRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('AI model not found', 'AI_MODEL_NOT_FOUND');
    }

    // Validate provider if changed (image or video)
    if (input.providerKey && !aiProviderRegistry.has(input.providerKey) && !aiProviderRegistry.hasVideo(input.providerKey)) {
      throw new BadRequestError(
        `AI provider '${input.providerKey}' is not available`,
        'INVALID_PROVIDER_KEY',
      );
    }

    // Check uniqueness if providerKey or modelId changed
    const newProviderKey = input.providerKey || existing.providerKey;
    const newModelId = input.modelId || existing.modelId;
    if (newProviderKey !== existing.providerKey || newModelId !== existing.modelId) {
      const models = await aiModelsRepo.findAll(
        { providerKey: newProviderKey, activeOnly: false },
        1,
        1000,
      );
      const duplicate = models.find((m) => m.modelId === newModelId && m.id !== id);
      if (duplicate) {
        throw new ConflictError(
          'A model with this provider key and model ID already exists',
          'AI_MODEL_ALREADY_EXISTS',
        );
      }
    }

    const model = await aiModelsRepo.update(id, input);

    logger.info({ aiModelId: id }, '[AI_MODELS] AI model updated');

    return sanitizeAiModel(model);
  }

  async deleteModel(id: string): Promise<void> {
    const existing = await aiModelsRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('AI model not found', 'AI_MODEL_NOT_FOUND');
    }

    await aiModelsRepo.deactivate(id);

    logger.info({ aiModelId: id }, '[AI_MODELS] AI model deactivated');
  }
}

export const aiModelsService = new AiModelsService();
