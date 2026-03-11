import { z } from 'zod';

export const getTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.enum(['PURCHASE', 'USAGE', 'REFUND', 'BONUS', 'ADMIN_ADJUSTMENT']).optional(),
});

export const adminAdjustSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  amount: z.number().int().refine((val) => val !== 0, {
    message: 'Amount must be a non-zero integer',
  }),
  description: z.string().min(1, 'Description is required').max(500).trim(),
});

export type GetTransactionsQuery = z.infer<typeof getTransactionsQuerySchema>;
export type AdminAdjustInput = z.infer<typeof adminAdjustSchema>;
