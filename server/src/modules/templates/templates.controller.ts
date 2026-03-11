import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@shared/responses/successResponse.js';
import { paginatedResponse } from '@shared/responses/paginatedResponse.js';
import { validateImageFile } from '@libs/storage/file-validator.js';
import { BadRequestError } from '@shared/errors/errors.js';
import { logger } from '@libs/logger.js';
import { templatesService } from './templates.service.js';
import type {
  ListTemplatesQuery,
  TemplateIdParams,
  CreateTemplateInput,
  UpdateTemplateInput,
} from './templates.schemas.js';

class TemplatesController {
  async list(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { page, limit, category, search, type } = request.query as ListTemplatesQuery;

    const { items, totalItems } = await templatesService.listTemplates(
      { category, search, type },
      page,
      limit,
    );

    reply.send(
      paginatedResponse('Templates retrieved', items, page, limit, totalItems),
    );
  }

  async getById(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { templateId } = request.params as TemplateIdParams;
    const template = await templatesService.getTemplate(templateId);
    reply.send(successResponse('Template retrieved', template));
  }

  async getCategories(
    _request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const categories = await templatesService.getCategories();
    reply.send(successResponse('Categories retrieved', { categories }));
  }

  async create(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const template = await templatesService.createTemplate(request.body as CreateTemplateInput);
    reply.status(201).send(successResponse('Template created successfully', template));
  }

  async update(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { templateId } = request.params as TemplateIdParams;
    const template = await templatesService.updateTemplate(
      templateId,
      request.body as UpdateTemplateInput,
    );
    reply.send(successResponse('Template updated successfully', template));
  }

  async delete(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { templateId } = request.params as TemplateIdParams;
    await templatesService.deleteTemplate(templateId);
    reply.send(successResponse('Template deleted successfully', null));
  }

  async uploadThumbnail(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { templateId } = request.params as TemplateIdParams;

    const data = await request.file();
    if (!data) {
      throw new BadRequestError('No file uploaded', 'NO_FILE');
    }

    const { buffer, mimeType, filename } = await validateImageFile(data);

    logger.info({
      msg: 'Template thumbnail upload request',
      templateId,
      filename,
      mimetype: mimeType,
      size: buffer.length,
    });

    const template = await templatesService.uploadThumbnail(templateId, buffer);

    reply.send(successResponse('Thumbnail uploaded successfully', template));
  }

  async deleteThumbnail(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { templateId } = request.params as TemplateIdParams;

    logger.info({ msg: 'Template thumbnail delete request', templateId });

    await templatesService.deleteThumbnail(templateId);

    reply.send(successResponse('Thumbnail deleted successfully', null));
  }
}

export const templatesController = new TemplatesController();
