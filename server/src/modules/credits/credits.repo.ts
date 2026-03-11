import { prisma } from '@libs/prisma.js';
import type { CreditTransactionType } from '@prisma/client';

export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  });
  return user?.creditBalance ?? 0;
}

export async function getTransactions(
  userId: string,
  filters: { type?: CreditTransactionType },
  page: number,
  limit: number,
): Promise<{
  id: string;
  amount: number;
  type: CreditTransactionType;
  balanceAfter: number;
  referenceId: string | null;
  description: string | null;
  createdAt: Date;
}[]> {
  const where: Record<string, unknown> = { userId };
  if (filters.type) {
    where.type = filters.type;
  }

  return prisma.creditTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function countTransactions(
  userId: string,
  filters: { type?: CreditTransactionType },
): Promise<number> {
  const where: Record<string, unknown> = { userId };
  if (filters.type) {
    where.type = filters.type;
  }

  return prisma.creditTransaction.count({ where });
}
