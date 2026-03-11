/**
 * AI Provider Registry
 *
 * Singleton registry that maps provider keys to their implementations.
 * Providers self-register at import time via the barrel file (index.ts).
 */

import { NotFoundError } from '@shared/errors/errors.js';
import { logger } from '@libs/logger.js';
import type { AiImageProvider } from './ai-provider.types.js';
import type { AiVideoProvider } from './ai-video-provider.types.js';

class AiProviderRegistry {
  private providers = new Map<string, AiImageProvider>();
  private videoProviders = new Map<string, AiVideoProvider>();

  // ─── Image Providers ──────────────────────────────────────

  register(provider: AiImageProvider): void {
    if (this.providers.has(provider.key)) {
      logger.warn({ providerKey: provider.key }, '[AI] Provider already registered, overwriting');
    }

    this.providers.set(provider.key, provider);
    logger.info({ providerKey: provider.key, providerName: provider.name }, '[AI] Provider registered');
  }

  get(key: string): AiImageProvider {
    const provider = this.providers.get(key);
    if (!provider) {
      throw new NotFoundError(
        `AI provider '${key}' is not registered`,
        'AI_PROVIDER_NOT_FOUND',
      );
    }
    return provider;
  }

  has(key: string): boolean {
    return this.providers.has(key);
  }

  listKeys(): string[] {
    return Array.from(this.providers.keys());
  }

  // ─── Video Providers ──────────────────────────────────────

  registerVideo(provider: AiVideoProvider): void {
    if (this.videoProviders.has(provider.key)) {
      logger.warn({ providerKey: provider.key }, '[AI] Video provider already registered, overwriting');
    }

    this.videoProviders.set(provider.key, provider);
    logger.info({ providerKey: provider.key, providerName: provider.name }, '[AI] Video provider registered');
  }

  getVideo(key: string): AiVideoProvider {
    const provider = this.videoProviders.get(key);
    if (!provider) {
      throw new NotFoundError(
        `AI video provider '${key}' is not registered`,
        'AI_VIDEO_PROVIDER_NOT_FOUND',
      );
    }
    return provider;
  }

  hasVideo(key: string): boolean {
    return this.videoProviders.has(key);
  }

  listVideoKeys(): string[] {
    return Array.from(this.videoProviders.keys());
  }
}

export const aiProviderRegistry = new AiProviderRegistry();
