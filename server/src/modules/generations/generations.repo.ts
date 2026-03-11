import { prisma } from '@libs/prisma.js';
import type { GenerationStatus, GenerationType, Prisma } from '@prisma/client';

const generationWithRelations = {
  include: {
    template: {
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        thumbnailUrl: true,
      },
    },
    aiModel: {
      select: {
        id: true,
        name: true,
        modelId: true,
        providerKey: true,
      },
    },
  },
} as const;

export async function create(data: {
  id: string;
  userId: string;
  templateId: string;
  aiModelId?: string;
  type?: GenerationType;
  status: GenerationStatus;
  inputImageUrl: string;
  outputImageUrl?: string;
  outputVideoUrl?: string;
  promptUsed: string;
  providerKey: string;
  modelId?: string;
  operationId?: string;
  videoDurationSeconds?: number;
  creditsCost: number;
  processingTimeMs?: number;
  errorMessage?: string;
}) {
  return prisma.generation.create({
    data,
    ...generationWithRelations,
  });
}

export async function findById(id: string) {
  return prisma.generation.findUnique({
    where: { id },
    ...generationWithRelations,
  });
}

export async function findByIdAndUserId(id: string, userId: string) {
  return prisma.generation.findFirst({
    where: { id, userId },
    ...generationWithRelations,
  });
}

export async function updateStatus(
  id: string,
  status: GenerationStatus,
  data?: {
    outputImageUrl?: string;
    outputVideoUrl?: string;
    processingTimeMs?: number;
    errorMessage?: string;
  },
) {
  return prisma.generation.update({
    where: { id },
    data: { status, ...data },
    ...generationWithRelations,
  });
}

export async function findByUserId(
  userId: string,
  filters: { status?: GenerationStatus; type?: GenerationType },
  page: number,
  limit: number,
) {
  const where: Prisma.GenerationWhereInput = { userId };
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.type) {
    where.type = filters.type;
  }

  return prisma.generation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    ...generationWithRelations,
  });
}

export async function countByUserId(
  userId: string,
  filters: { status?: GenerationStatus; type?: GenerationType },
): Promise<number> {
  const where: Prisma.GenerationWhereInput = { userId };
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.type) {
    where.type = filters.type;
  }

  return prisma.generation.count({ where });
}

export async function deleteById(id: string): Promise<void> {
  await prisma.generation.delete({ where: { id } });
}
