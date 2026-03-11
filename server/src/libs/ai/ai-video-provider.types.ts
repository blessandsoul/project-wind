/**
 * AI Video Provider Abstraction Types
 *
 * Defines the interface all AI video providers must implement.
 * Video generation is async (start + poll pattern), unlike sync image transformation.
 */

export interface AiVideoInput {
  imageBuffer: Buffer;
  mimeType: string; // 'image/jpeg' | 'image/png' | 'image/webp'
  prompt: string; // Fully interpolated prompt
  modelId: string; // API model identifier (e.g., 'veo-3.1-fast-generate-preview')
  durationSeconds: 4 | 6 | 8;
}

export interface AiVideoStartOutput {
  operationId: string; // Provider operation name for polling
}

export interface AiVideoPollOutput {
  done: boolean;
  videoBuffer?: Buffer; // Present when done=true and successful
  mimeType?: string; // e.g., 'video/mp4'
  error?: string; // Present if generation failed
}

export interface AiVideoProvider {
  readonly key: string; // e.g., 'gemini'
  readonly name: string; // e.g., 'Google Gemini Veo'
  startVideoGeneration(input: AiVideoInput): Promise<AiVideoStartOutput>;
  pollVideoGeneration(operationId: string): Promise<AiVideoPollOutput>;
}
