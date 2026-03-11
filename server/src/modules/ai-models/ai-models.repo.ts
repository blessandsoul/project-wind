import { prisma } from '@libs/prisma.js';
import type { AiModel, GenerationType, Prisma } from '@prisma/client';

function buildWhereClause(filters: {
  providerKey?: string;
  type?: GenerationType;
  activeOnly?: boolean;
}): Prisma.AiModelWhereInput {
  const where: Prisma.AiModelWhereInput = {};

  if (filters.activeOnly !== false) {
    where.isActive = true;
  }

  if (filters.providerKey) {
    where.providerKey = filters.providerKey;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  return where;
}

export async function findAll(
  filters: { providerKey?: string; type?: GenerationType; activeOnly?: boolean },
  page: number,
  limit: number,
): Promise<AiModel[]> {
  const where = buildWhereClause(filters);

  return prisma.aiModel.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function countAll(
  filters: { providerKey?: string; type?: GenerationType; activeOnly?: boolean },
): Promise<number> {
  const where = buildWhereClause(filters);
  return prisma.aiModel.count({ where });
}

export async function findById(id: string): Promise<AiModel | null> {
  return prisma.aiModel.findUnique({ where: { id } });
}

export async function create(data: {
  providerKey: string;
  modelId: string;
  name: string;
  description?: string;
  type?: GenerationType;
  creditCost: number;
  isActive: boolean;
  sortOrder: number;
}): Promise<AiModel> {
  return prisma.aiModel.create({ data });
}

export async function update(
  id: string,
  data: Prisma.AiModelUpdateInput,
): Promise<AiModel> {
  return prisma.aiModel.update({ where: { id }, data });
}

export async function deactivate(id: string): Promise<AiModel> {
  return prisma.aiModel.update({
    where: { id },
    data: { isActive: false },
  });
}
