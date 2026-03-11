import { prisma } from '@libs/prisma.js';
import { env } from '@config/env.js';
import { logger } from '@libs/logger.js';
import { BadRequestError, NotFoundError } from '@shared/errors/errors.js';
import type { CreditTransactionType } from '@prisma/client';
import * as creditsRepo from './credits.repo.js';

interface TransactionResult {
  id: string;
  amount: number;
  type: CreditTransactionType;
  balanceAfter: number;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

function formatTransaction(tx: {
  id: string;
  amount: number;
  type: CreditTransactionType;
  balanceAfter: number;
  referenceId: string | null;
  description: string | null;
  createdAt: Date;
}): TransactionResult {
  return {
    id: tx.id,
    amount: tx.amount,
    type: tx.type,
    balanceAfter: tx.balanceAfter,
    referenceId: tx.referenceId,
    description: tx.description,
    createdAt: tx.createdAt.toISOString(),
  };
}

class CreditsService {
  async getBalance(userId: string): Promise<number> {
    return creditsRepo.getBalance(userId);
  }

  async getTransactions(
    userId: string,
    filters: { type?: CreditTransactionType },
    page: number,
    limit: number,
  ): Promise<{ items: TransactionResult[]; totalItems: number }> {
    const [transactions, totalItems] = await Promise.all([
      creditsRepo.getTransactions(userId, filters, page, limit),
      creditsRepo.countTransactions(userId, filters),
    ]);

    return {
      items: transactions.map(formatTransaction),
      totalItems,
    };
  }

  async deductCredits(
    userId: string,
    amount: number,
    generationId: string,
    description: string = 'Image generation',
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      });

      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      if (user.creditBalance < amount) {
        throw new BadRequestError(
          'Insufficient credits for this operation',
          'INSUFFICIENT_CREDITS',
        );
      }

      const newBalance = user.creditBalance - amount;

      await tx.user.update({
        where: { id: userId },
        data: { creditBalance: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'USAGE',
          balanceAfter: newBalance,
          referenceId: generationId,
          description,
        },
      });
    });

    logger.info({ userId, amount, generationId }, '[CREDITS] Credits deducted');
  }

  async addCredits(
    userId: string,
    amount: number,
    type: CreditTransactionType,
    referenceId?: string,
    description?: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      });

      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }

      const newBalance = user.creditBalance + amount;

      await tx.user.update({
        where: { id: userId },
        data: { creditBalance: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          type,
          balanceAfter: newBalance,
          referenceId: referenceId ?? null,
          description: description ?? null,
        },
      });
    });

    logger.info({ userId, amount, type }, '[CREDITS] Credits added');
  }

  async refundCredits(
    userId: string,
    amount: number,
    generationId: string,
  ): Promise<void> {
    await this.addCredits(
      userId,
      amount,
      'REFUND',
      generationId,
      'Generation refund',
    );
  }

  async grantWelcomeBonus(userId: string): Promise<void> {
    const bonusAmount = env.INITIAL_FREE_CREDITS;
    if (bonusAmount <= 0) {
      return;
    }

    await this.addCredits(
      userId,
      bonusAmount,
      'BONUS',
      undefined,
      'Welcome bonus',
    );

    logger.info({ userId, bonusAmount }, '[CREDITS] Welcome bonus granted');
  }
}

export const creditsService = new CreditsService();
