/**
 * AI Provider Module Barrel
 *
 * Importing this file triggers provider registration.
 * Add new provider imports here to register them automatically.
 */

// Register providers (order doesn't matter — each self-registers)
import './providers/gemini.provider.js';
import './providers/gemini-video.provider.js';

// Re-export public API
export { aiProviderRegistry } from './ai-provider.registry.js';
export type { AiImageProvider, AiImageInput, AiImageOutput } from './ai-provider.types.js';
export type { AiVideoProvider, AiVideoInput, AiVideoStartOutput, AiVideoPollOutput } from './ai-video-provider.types.js';
