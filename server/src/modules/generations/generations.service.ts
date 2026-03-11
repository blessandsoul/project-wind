import { v4 as uuid } from 'uuid';
import { logger } from '@libs/logger.js';
import { aiProviderRegistry } from '@libs/ai/index.js';
import { fileStorageService } from '@libs/storage/file-storage.service.js';
import { imageOptimizerService } from '@libs/storage/image-optimizer.service.js';
import { NotFoundError, BadRequestError, InternalError } from '@shared/errors/errors.js';
import { creditsService } from '@modules/credits/credits.service.js';
import { templatesService } from '@modules/templates/templates.service.js';
import { aiModelsService } from '@modules/ai-models/ai-models.service.js';
import { videoGenerationQueue } from '@libs/queue/video-generation.queue.js';
import * as generationsRepo from './generations.repo.js';
import type { GenerationStatus, GenerationType } from '@prisma/client';

interface SanitizedGeneration {
  id: string;
  userId: string;
  templateId: string;
  aiModelId: string | null;
  type: GenerationType;
  status: GenerationStatus;
  inputImageUrl: string;
  outputImageUrl: string | null;
  outputVideoUrl: string | null;
  promptUsed: string;
  providerKey: string;
  modelId: string | null;
  videoDurationSeconds: number | null;
  creditsCost: number;
  processingTimeMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    slug: string;
    category: string;
    thumbnailUrl: string | null;
  };
  aiModel: {
    id: string;
    name: string;
    modelId: string;
    providerKey: string;
  } | null;
}

function sanitizeGeneration(generation: {
  id: string;
  userId: string;
  templateId: string;
  aiModelId: string | null;
  type: GenerationType;
  status: GenerationStatus;
  inputImageUrl: string;
  outputImageUrl: string | null;
  outputVideoUrl: string | null;
  promptUsed: string;
  providerKey: string;
  modelId: string | null;
  videoDurationSeconds: number | null;
  creditsCost: number;
  processingTimeMs: number | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  template: {
    id: string;
    name: string;
    slug: string;
    category: string;
    thumbnailUrl: string | null;
  };
  aiModel: {
    id: string;
    name: string;
    modelId: string;
    providerKey: string;
  } | null;
}): SanitizedGeneration {
  return {
    id: generation.id,
    userId: generation.userId,
    templateId: generation.templateId,
    aiModelId: generation.aiModelId,
    type: generation.type,
    status: generation.status,
    inputImageUrl: generation.inputImageUrl,
    outputImageUrl: generation.outputImageUrl,
    outputVideoUrl: generation.outputVideoUrl,
    promptUsed: generation.promptUsed,
    providerKey: generation.providerKey,
    modelId: generation.modelId,
    videoDurationSeconds: generation.videoDurationSeconds,
    creditsCost: generation.creditsCost,
    processingTimeMs: generation.processingTimeMs,
    errorMessage: generation.errorMessage,
    createdAt: generation.createdAt.toISOString(),
    updatedAt: generation.updatedAt.toISOString(),
    template: generation.template,
    aiModel: generation.aiModel,
  };
}

class GenerationsService {
  async createGeneration(
    userId: string,
    templateId: string,
    aiModelId: string,
    imageBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
  ): Promise<SanitizedGeneration> {
    // 1. Fetch and validate template
    const template = await templatesService.getTemplate(templateId);
    if (!template.isActive) {
      throw new BadRequestError('This template is no longer available', 'TEMPLATE_INACTIVE');
    }

    // 2. Fetch and validate AI model
    const aiModel = await aiModelsService.getModelRaw(aiModelId);
    if (!aiModel.isActive) {
      throw new BadRequestError('This AI model is no longer available', 'AI_MODEL_INACTIVE');
    }

    // 3. Validate provider exists in registry
    const provider = aiProviderRegistry.get(aiModel.providerKey);

    // 4. Calculate total cost and check credits
    const totalCost = template.creditCost + aiModel.creditCost;
    const balance = await creditsService.getBalance(userId);
    if (balance < totalCost) {
      throw new BadRequestError(
        'Insufficient credits for this operation',
        'INSUFFICIENT_CREDITS',
      );
    }

    // 5. Generate ID and save input image
    const generationId = uuid();
    const { url: inputImageUrl } = await fileStorageService.saveGenerationInput(
      generationId,
      imageBuffer,
      originalFilename,
    );

    // 6. Interpolate prompt
    const promptUsed = templatesService.interpolatePrompt(template.promptTemplate);

    try {
      // 7. Call AI provider
      logger.info({
        generationId,
        templateId,
        aiModelId,
        providerKey: aiModel.providerKey,
        modelId: aiModel.modelId,
        userId,
      }, '[GENERATIONS] Starting AI transformation');

      const aiResult = await provider.transformImage({
        imageBuffer,
        mimeType,
        prompt: promptUsed,
        modelId: aiModel.modelId,
      });

      // 8. Optimize output image
      const optimizedBuffer = await imageOptimizerService.optimizeGeneration(aiResult.imageBuffer);

      // 9. Save output image
      const { url: outputImageUrl } = await fileStorageService.saveGenerationOutput(
        generationId,
        optimizedBuffer,
      );

      // 10. Deduct credits
      await creditsService.deductCredits(userId, totalCost, generationId);

      // 11. Create generation record
      const generation = await generationsRepo.create({
        id: generationId,
        userId,
        templateId,
        aiModelId,
        type: 'IMAGE',
        status: 'COMPLETED',
        inputImageUrl,
        outputImageUrl,
        promptUsed,
        providerKey: aiModel.providerKey,
        modelId: aiModel.modelId,
        creditsCost: totalCost,
        processingTimeMs: aiResult.processingTimeMs,
      });

      logger.info({
        generationId,
        processingTimeMs: aiResult.processingTimeMs,
        creditsCost: totalCost,
      }, '[GENERATIONS] Generation completed successfully');

      return sanitizeGeneration(generation);
    } catch (error) {
      // On failure: save failed generation, do NOT deduct credits
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      try {
        await generationsRepo.create({
          id: generationId,
          userId,
          templateId,
          aiModelId,
          type: 'IMAGE',
          status: 'FAILED',
          inputImageUrl,
          promptUsed,
          providerKey: aiModel.providerKey,
          modelId: aiModel.modelId,
          creditsCost: totalCost,
          errorMessage,
        });
      } catch (saveError) {
        logger.error({ err: saveError, generationId }, '[GENERATIONS] Failed to save error record');
      }

      logger.error({ err: error, generationId }, '[GENERATIONS] Generation failed');

      // Re-throw typed errors as-is, wrap unknown errors
      if (error instanceof BadRequestError || error instanceof InternalError) {
        throw error;
      }

      throw new InternalError(
        'Image generation failed. No credits were deducted.',
        'GENERATION_FAILED',
      );
    }
  }

  async createVideoGeneration(
    userId: string,
    templateId: string,
    aiModelId: string,
    durationSeconds: 4 | 6 | 8,
    imageBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
  ): Promise<SanitizedGeneration> {
    // 1. Fetch and validate template (must be VIDEO type)
    const template = await templatesService.getTemplate(templateId);
    if (!template.isActive) {
      throw new BadRequestError('This template is no longer available', 'TEMPLATE_INACTIVE');
    }
    if (template.type !== 'VIDEO') {
      throw new BadRequestError('This template is not a video template', 'TEMPLATE_TYPE_MISMATCH');
    }

    // 2. Fetch and validate AI model (must be VIDEO type)
    const aiModel = await aiModelsService.getModelRaw(aiModelId);
    if (!aiModel.isActive) {
      throw new BadRequestError('This AI model is no longer available', 'AI_MODEL_INACTIVE');
    }
    if (aiModel.type !== 'VIDEO') {
      throw new BadRequestError('This AI model is not a video model', 'AI_MODEL_TYPE_MISMATCH');
    }

    // 3. Validate video provider exists in registry
    if (!aiProviderRegistry.hasVideo(aiModel.providerKey)) {
      throw new BadRequestError(
        'No video provider available for this model',
        'AI_VIDEO_PROVIDER_NOT_FOUND',
      );
    }
    const provider = aiProviderRegistry.getVideo(aiModel.providerKey);

    // 4. Calculate total cost and check credits
    const totalCost = template.creditCost + aiModel.creditCost;
    const balance = await creditsService.getBalance(userId);
    if (balance < totalCost) {
      throw new BadRequestError(
        'Insufficient credits for this operation',
        'INSUFFICIENT_CREDITS',
      );
    }

    // 5. Deduct credits UPFRONT (prevents overspending while job is queued)
    const generationId = uuid();
    await creditsService.deductCredits(userId, totalCost, generationId, 'Video generation');

    // 6. Save input image
    const { url: inputImageUrl } = await fileStorageService.saveGenerationInput(
      generationId,
      imageBuffer,
      originalFilename,
    );

    // 7. Interpolate prompt
    const promptUsed = templatesService.interpolatePrompt(template.promptTemplate);

    try {
      // 8. Start async video generation with AI provider
      logger.info({
        generationId,
        templateId,
        aiModelId,
        providerKey: aiModel.providerKey,
        modelId: aiModel.modelId,
        durationSeconds,
        userId,
      }, '[GENERATIONS] Starting video generation');

      const { operationId } = await provider.startVideoGeneration({
        imageBuffer,
        mimeType,
        prompt: promptUsed,
        modelId: aiModel.modelId,
        durationSeconds,
      });

      // 9. Create generation record with PROCESSING status
      const generation = await generationsRepo.create({
        id: generationId,
        userId,
        templateId,
        aiModelId,
        type: 'VIDEO',
        status: 'PROCESSING',
        inputImageUrl,
        promptUsed,
        providerKey: aiModel.providerKey,
        modelId: aiModel.modelId,
        operationId,
        videoDurationSeconds: durationSeconds,
        creditsCost: totalCost,
      });

      // 10. Add job to BullMQ queue for background processing
      await videoGenerationQueue.add(
        `video-${generationId}`,
        {
          generationId,
          userId,
          operationId,
          providerKey: aiModel.providerKey,
          creditsCost: totalCost,
          startedAt: Date.now(),
        },
        {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 10_000,
          },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 200 },
        },
      );

      logger.info({
        generationId,
        operationId,
      }, '[GENERATIONS] Video generation job queued');

      return sanitizeGeneration(generation);
    } catch (error) {
      // On failure: save failed record AND refund credits
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      try {
        await generationsRepo.create({
          id: generationId,
          userId,
          templateId,
          aiModelId,
          type: 'VIDEO',
          status: 'FAILED',
          inputImageUrl,
          promptUsed,
          providerKey: aiModel.providerKey,
          modelId: aiModel.modelId,
          videoDurationSeconds: durationSeconds,
          creditsCost: totalCost,
          errorMessage,
        });
      } catch (saveError) {
        logger.error({ err: saveError, generationId }, '[GENERATIONS] Failed to save error record');
      }

      // Refund credits since we deducted upfront
      try {
        await creditsService.refundCredits(userId, totalCost, generationId);
      } catch (refundError) {
        logger.error({ err: refundError, generationId, userId, totalCost }, '[GENERATIONS] Failed to refund credits');
      }

      logger.error({ err: error, generationId }, '[GENERATIONS] Video generation failed');

      if (error instanceof BadRequestError || error instanceof InternalError) {
        throw error;
      }

      throw new InternalError(
        'Video generation failed. Credits have been refunded.',
        'VIDEO_GENERATION_FAILED',
      );
    }
  }

  async getGeneration(
    generationId: string,
    userId: string,
  ): Promise<SanitizedGeneration> {
    const generation = await generationsRepo.findByIdAndUserId(generationId, userId);
    if (!generation) {
      throw new NotFoundError('Generation not found', 'GENERATION_NOT_FOUND');
    }
    return sanitizeGeneration(generation);
  }

  async listGenerations(
    userId: string,
    filters: { status?: GenerationStatus; type?: GenerationType },
    page: number,
    limit: number,
  ): Promise<{ items: SanitizedGeneration[]; totalItems: number }> {
    const [generations, totalItems] = await Promise.all([
      generationsRepo.findByUserId(userId, filters, page, limit),
      generationsRepo.countByUserId(userId, filters),
    ]);

    return {
      items: generations.map(sanitizeGeneration),
      totalItems,
    };
  }

  async deleteGeneration(
    generationId: string,
    userId: string,
  ): Promise<void> {
    const generation = await generationsRepo.findByIdAndUserId(generationId, userId);
    if (!generation) {
      throw new NotFoundError('Generation not found', 'GENERATION_NOT_FOUND');
    }

    // Delete files
    await fileStorageService.deleteGeneration(generationId);

    // Delete DB record
    await generationsRepo.deleteById(generationId);

    logger.info({ generationId, userId }, '[GENERATIONS] Generation deleted');
  }
}

export const generationsService = new GenerationsService();
