import { z } from 'zod';

export const listAiModelsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  providerKey: z.string().max(50).optional(),
  type: z.enum(['IMAGE', 'VIDEO']).optional(),
});

export const aiModelIdParamSchema = z.object({
  aiModelId: z.string().uuid({ message: 'Invalid AI model ID format' }),
});

export const createAiModelSchema = z.object({
  providerKey: z.string().min(1, 'Provider key is required').max(50).trim(),
  modelId: z.string().min(1, 'Model ID is required').max(200).trim(),
  name: z.string().min(1, 'Name is required').max(255).trim(),
  description: z.string().max(5000).trim().optional(),
  type: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
  creditCost: z.number().int().min(0).max(1000).default(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateAiModelSchema = z.object({
  providerKey: z.string().min(1).max(50).trim().optional(),
  modelId: z.string().min(1).max(200).trim().optional(),
  name: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(5000).trim().nullable().optional(),
  creditCost: z.number().int().min(0).max(1000).optional(),
  type: z.enum(['IMAGE', 'VIDEO']).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type ListAiModelsQuery = z.infer<typeof listAiModelsQuerySchema>;
export type AiModelIdParams = z.infer<typeof aiModelIdParamSchema>;
export type CreateAiModelInput = z.infer<typeof createAiModelSchema>;
export type UpdateAiModelInput = z.infer<typeof updateAiModelSchema>;
