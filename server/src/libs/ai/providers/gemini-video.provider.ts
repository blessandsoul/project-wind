/**
 * Google Gemini Veo Video Provider
 *
 * Uses the @google/genai SDK to generate videos from images via Gemini's
 * Veo models (image input + text prompt → video).
 *
 * Video generation is async: start returns an operation ID, then poll until done.
 */

import { GoogleGenAI } from '@google/genai';
import { env } from '@config/env.js';
import { logger } from '@libs/logger.js';
import { InternalError } from '@shared/errors/errors.js';
import { aiProviderRegistry } from '../ai-provider.registry.js';
import type { AiVideoProvider, AiVideoInput, AiVideoStartOutput, AiVideoPollOutput } from '../ai-video-provider.types.js';

class GeminiVideoProvider implements AiVideoProvider {
  readonly key = 'gemini';
  readonly name = 'Google Gemini Veo';
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  async startVideoGeneration(input: AiVideoInput): Promise<AiVideoStartOutput> {
    try {
      logger.info({
        provider: this.key,
        model: input.modelId,
        mimeType: input.mimeType,
        imageSize: input.imageBuffer.length,
        promptLength: input.prompt.length,
        durationSeconds: input.durationSeconds,
      }, '[AI] Starting video generation');

      const operation = await this.client.models.generateVideos({
        model: input.modelId,
        prompt: input.prompt,
        image: {
          imageBytes: input.imageBuffer.toString('base64'),
          mimeType: input.mimeType,
        },
        config: {
          durationSeconds: input.durationSeconds,
          numberOfVideos: 1,
        },
      });

      if (!operation.name) {
        throw new InternalError(
          'Video generation failed: no operation ID returned',
          'AI_VIDEO_NO_OPERATION',
        );
      }

      logger.info({
        provider: this.key,
        operationId: operation.name,
      }, '[AI] Video generation operation started');

      return { operationId: operation.name };
    } catch (error) {
      if (error instanceof InternalError) {
        throw error;
      }

      logger.error({
        err: error,
        provider: this.key,
      }, '[AI] Failed to start video generation');

      throw new InternalError(
        'Video generation failed due to an AI provider error',
        'AI_VIDEO_PROVIDER_ERROR',
      );
    }
  }

  async pollVideoGeneration(operationId: string): Promise<AiVideoPollOutput> {
    try {
      // Poll via REST API directly — the SDK's getVideosOperation() requires
      // a full GenerateVideosOperation instance with internal methods, which
      // we can't reconstruct from just the operation name string after
      // serializing through BullMQ.
      const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${env.GEMINI_API_KEY}`;
      const pollResponse = await fetch(pollUrl);

      if (!pollResponse.ok) {
        throw new InternalError(
          `Failed to poll video operation: HTTP ${pollResponse.status}`,
          'AI_VIDEO_POLL_HTTP_ERROR',
        );
      }

      const operation = await pollResponse.json() as {
        done?: boolean;
        error?: Record<string, unknown>;
        response?: {
          generateVideoResponse?: {
            generatedSamples?: Array<{ video?: { uri?: string } }>;
            raiMediaFilteredCount?: number;
          };
        };
      };

      if (!operation.done) {
        return { done: false };
      }

      // Check for errors
      if (operation.error) {
        const errorMessage = JSON.stringify(operation.error);

        logger.warn({
          provider: this.key,
          operationId,
          error: errorMessage,
        }, '[AI] Video generation operation failed');

        return { done: true, error: errorMessage };
      }

      // Extract video from response
      const videoResponse = operation.response?.generateVideoResponse;
      const generatedVideo = videoResponse?.generatedSamples?.[0];
      if (!generatedVideo?.video?.uri) {
        logger.warn({
          provider: this.key,
          operationId,
          raiFilteredCount: videoResponse?.raiMediaFilteredCount,
        }, '[AI] No video in response');

        return {
          done: true,
          error: 'Video generation completed but no video was produced (possibly filtered by safety policies)',
        };
      }

      // Download the video from the URI (valid for 24 hours)
      const videoUrl = `${generatedVideo.video.uri}&key=${env.GEMINI_API_KEY}`;
      const response = await fetch(videoUrl);

      if (!response.ok) {
        throw new InternalError(
          `Failed to download generated video: HTTP ${response.status}`,
          'AI_VIDEO_DOWNLOAD_FAILED',
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const videoBuffer = Buffer.from(arrayBuffer);

      logger.info({
        provider: this.key,
        operationId,
        videoSize: videoBuffer.length,
      }, '[AI] Video generation completed and downloaded');

      return {
        done: true,
        videoBuffer,
        mimeType: 'video/mp4',
      };
    } catch (error) {
      if (error instanceof InternalError) {
        throw error;
      }

      logger.error({
        err: error,
        provider: this.key,
        operationId,
      }, '[AI] Failed to poll video generation');

      throw new InternalError(
        'Failed to check video generation status',
        'AI_VIDEO_POLL_ERROR',
      );
    }
  }
}

// Self-register when this file is imported
aiProviderRegistry.registerVideo(new GeminiVideoProvider());
