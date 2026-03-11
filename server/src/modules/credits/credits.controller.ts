import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@shared/responses/successResponse.js';
import { paginatedResponse } from '@shared/responses/paginatedResponse.js';
import { creditsService } from './credits.service.js';
import type { GetTransactionsQuery, AdminAdjustInput } from './credits.schemas.js';

class CreditsController {
  async getBalance(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = request.user.userId;
    const balance = await creditsService.getBalance(userId);

    reply.send(successResponse('Credit balance retrieved', { balance }));
  }

  async getTransactions(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = request.user.userId;
    const { page, limit, type } = request.query as GetTransactionsQuery;

    const { items, totalItems } = await creditsService.getTransactions(
      userId,
      { type },
      page,
      limit,
    );

    reply.send(
      paginatedResponse('Credit transactions retrieved', items, page, limit, totalItems),
    );
  }

  async adminAdjust(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId, amount, description } = request.body as AdminAdjustInput;

    if (amount > 0) {
      await creditsService.addCredits(userId, amount, 'ADMIN_ADJUSTMENT', undefined, description);
    } else {
      await creditsService.deductCredits(userId, Math.abs(amount), `admin-${request.user.userId}`);
    }

    const balance = await creditsService.getBalance(userId);

    reply.send(
      successResponse('Credits adjusted successfully', { userId, balance }),
    );
  }
}

export const creditsController = new CreditsController();
