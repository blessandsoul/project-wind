import { prisma } from '@libs/prisma.js';
import type { GenerationType, Prisma, Template } from '@prisma/client';

function buildWhereClause(filters: {
  category?: string;
  search?: string;
  type?: GenerationType;
  activeOnly?: boolean;
}): Prisma.TemplateWhereInput {
  const where: Prisma.TemplateWhereInput = {};

  if (filters.activeOnly !== false) {
    where.isActive = true;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  return where;
}

export async function findAll(
  filters: { category?: string; search?: string; type?: GenerationType; activeOnly?: boolean },
  page: number,
  limit: number,
): Promise<Template[]> {
  const where = buildWhereClause(filters);

  return prisma.template.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function countAll(
  filters: { category?: string; search?: string; type?: GenerationType; activeOnly?: boolean },
): Promise<number> {
  const where = buildWhereClause(filters);
  return prisma.template.count({ where });
}

export async function findById(id: string): Promise<Template | null> {
  return prisma.template.findUnique({ where: { id } });
}

export async function findBySlug(slug: string): Promise<Template | null> {
  return prisma.template.findUnique({ where: { slug } });
}

export async function create(data: {
  name: string;
  slug: string;
  description?: string;
  category: string;
  type?: GenerationType;
  promptTemplate: string;
  providerKey?: string;
  creditCost: number;
  sortOrder: number;
}): Promise<Template> {
  return prisma.template.create({ data });
}

export async function update(
  id: string,
  data: Prisma.TemplateUpdateInput,
): Promise<Template> {
  return prisma.template.update({ where: { id }, data });
}

export async function deactivate(id: string): Promise<Template> {
  return prisma.template.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function getDistinctCategories(): Promise<string[]> {
  const results = await prisma.template.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  return results.map((r) => r.category);
}

export async function updateThumbnailUrl(
  id: string,
  thumbnailUrl: string,
): Promise<Template> {
  return prisma.template.update({
    where: { id },
    data: { thumbnailUrl },
  });
}

export async function clearThumbnailUrl(id: string): Promise<Template> {
  return prisma.template.update({
    where: { id },
    data: { thumbnailUrl: null },
  });
}
