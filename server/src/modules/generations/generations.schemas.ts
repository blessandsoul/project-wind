import { z } from 'zod';

export const createGenerationFieldsSchema = z.object({
  templateId: z.string().uuid({ message: 'Invalid template ID format' }),
  aiModelId: z.string().uuid({ message: 'Invalid AI model ID format' }),
});

export const createVideoGenerationFieldsSchema = z.object({
  templateId: z.string().uuid({ message: 'Invalid template ID format' }),
  aiModelId: z.string().uuid({ message: 'Invalid AI model ID format' }),
  durationSeconds: z.coerce.number().refine(
    (v) => [4, 6, 8].includes(v),
    { message: 'Duration must be 4, 6, or 8 seconds' },
  ),
});

export const listGenerationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  type: z.enum(['IMAGE', 'VIDEO']).optional(),
});

export const generationIdParamSchema = z.object({
  generationId: z.string().uuid({ message: 'Invalid generation ID format' }),
});

export type CreateGenerationFields = z.infer<typeof createGenerationFieldsSchema>;
export type CreateVideoGenerationFields = z.infer<typeof createVideoGenerationFieldsSchema>;
export type ListGenerationsQuery = z.infer<typeof listGenerationsQuerySchema>;
export type GenerationIdParams = z.infer<typeof generationIdParamSchema>;
