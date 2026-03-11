import { z } from 'zod';

export const listTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  type: z.enum(['IMAGE', 'VIDEO']).optional(),
});

export const templateIdParamSchema = z.object({
  templateId: z.string().uuid({ message: 'Invalid template ID format' }),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).trim(),
  slug: z.string().min(1).max(255).trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only')
    .optional(),
  description: z.string().max(5000).trim().optional(),
  category: z.string().min(1, 'Category is required').max(100).trim(),
  promptTemplate: z.string().min(1, 'Prompt template is required').max(10000).trim(),
  providerKey: z.string().min(1).max(50).optional(),
  type: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
  creditCost: z.number().int().min(1).max(1000).default(1),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  slug: z.string().min(1).max(255).trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only')
    .optional(),
  description: z.string().max(5000).trim().nullable().optional(),
  category: z.string().min(1).max(100).trim().optional(),
  promptTemplate: z.string().min(1).max(10000).trim().optional(),
  providerKey: z.string().min(1).max(50).optional(),
  creditCost: z.number().int().min(1).max(1000).optional(),
  type: z.enum(['IMAGE', 'VIDEO']).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;
export type TemplateIdParams = z.infer<typeof templateIdParamSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
