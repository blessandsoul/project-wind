import type { FastifyInstance } from 'fastify';
import { authenticate, authorize } from '@libs/auth.js';
import { RATE_LIMITS } from '@config/rate-limit.config.js';
import { creditsController } from './credits.controller.js';
import { getTransactionsQuerySchema, adminAdjustSchema } from './credits.schemas.js';

export async function creditRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Get credit balance
   *
   * GET /api/v1/credits/balance
   * Auth: Required
   */
  fastify.get('/credits/balance', {
    preValidation: [authenticate],
    config: {
      rateLimit: RATE_LIMITS.CREDITS_BALANCE,
    },
    handler: creditsController.getBalance.bind(creditsController),
  });

  /**
   * List credit transactions
   *
   * GET /api/v1/credits/transactions
   * Auth: Required
   * Query: { page?, limit?, type? }
   */
  fastify.get('/credits/transactions', {
    preValidation: [authenticate],
    schema: {
      querystring: getTransactionsQuerySchema,
    },
    config: {
      rateLimit: RATE_LIMITS.CREDITS_TRANSACTIONS,
    },
    handler: creditsController.getTransactions.bind(creditsController),
  });

  /**
   * Admin: Adjust user credits
   *
   * POST /api/v1/credits/admin/adjust
   * Auth: Required (ADMIN)
   * Body: { userId, amount, description }
   */
  fastify.post('/credits/admin/adjust', {
    preValidation: [authenticate, authorize('ADMIN')],
    schema: {
      body: adminAdjustSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.CREDITS_ADMIN_ADJUST,
    },
    handler: creditsController.adminAdjust.bind(creditsController),
  });
}
