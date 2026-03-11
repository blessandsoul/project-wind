/**
 * Google Gemini AI Provider
 *
 * Uses the @google/genai SDK to transform images via Gemini's
 * native image generation capabilities (image input + text prompt → edited image).
 */

import { GoogleGenAI } from '@google/genai';
import { env } from '@config/env.js';
import { logger } from '@libs/logger.js';
import { InternalError } from '@shared/errors/errors.js';
import { aiProviderRegistry } from '../ai-provider.registry.js';
import type { AiImageProvider, AiImageInput, AiImageOutput } from '../ai-provider.types.js';

class GeminiProvider implements AiImageProvider {
  readonly key = 'gemini';
  readonly name = 'Google Gemini';
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  async transformImage(input: AiImageInput): Promise<AiImageOutput> {
    const startTime = Date.now();

    try {
      logger.info({
        provider: this.key,
        model: input.modelId,
        mimeType: input.mimeType,
        imageSize: input.imageBuffer.length,
        promptLength: input.prompt.length,
      }, '[AI] Starting image transformation');

      const response = await this.client.models.generateContent({
        model: input.modelId,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: input.mimeType,
                  data: input.imageBuffer.toString('base64'),
                },
              },
              { text: input.prompt },
            ],
          },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      // Extract image from response parts
      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts || parts.length === 0) {
        throw new InternalError('Gemini returned no response parts', 'AI_EMPTY_RESPONSE');
      }

      const imagePart = parts.find(
        (part) => part.inlineData?.mimeType?.startsWith('image/'),
      );

      if (!imagePart?.inlineData?.data) {
        // Check if there's a text-only response (possibly a safety refusal)
        const textPart = parts.find((part) => part.text);
        const textMessage = textPart?.text || 'Unknown reason';
        logger.warn({ provider: this.key, textResponse: textMessage }, '[AI] No image in response');
        throw new InternalError(
          'Image generation failed: the AI could not process this image',
          'AI_NO_IMAGE_OUTPUT',
        );
      }

      const outputBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const outputMimeType = imagePart.inlineData.mimeType || 'image/png';
      const processingTimeMs = Date.now() - startTime;

      logger.info({
        provider: this.key,
        processingTimeMs,
        outputSize: outputBuffer.length,
        outputMimeType,
      }, '[AI] Image transformation completed');

      return {
        imageBuffer: outputBuffer,
        mimeType: outputMimeType,
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;

      // Re-throw AppError subclasses as-is
      if (error instanceof InternalError) {
        throw error;
      }

      logger.error({
        err: error,
        provider: this.key,
        processingTimeMs,
      }, '[AI] Image transformation failed');

      throw new InternalError(
        'Image generation failed due to an AI provider error',
        'AI_PROVIDER_ERROR',
      );
    }
  }
}

// Self-register when this file is imported
aiProviderRegistry.register(new GeminiProvider());
