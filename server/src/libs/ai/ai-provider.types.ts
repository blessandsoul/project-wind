/**
 * AI Provider Abstraction Types
 *
 * Defines the interface all AI image providers must implement.
 * Adding a new provider = implementing AiImageProvider + registering it.
 */

export interface AiImageInput {
  imageBuffer: Buffer;
  mimeType: string; // 'image/jpeg' | 'image/png' | 'image/webp'
  prompt: string; // Fully interpolated prompt
  modelId: string; // API model identifier (e.g., 'gemini-2.5-flash-preview-05-20')
}

export interface AiImageOutput {
  imageBuffer: Buffer;
  mimeType: string;
  processingTimeMs: number;
}

export interface AiImageProvider {
  readonly key: string; // e.g., 'gemini', 'replicate', 'stability'
  readonly name: string; // e.g., 'Google Gemini'
  transformImage(input: AiImageInput): Promise<AiImageOutput>;
}
