/**
 * Video Generation Worker
 *
 * BullMQ worker that processes video generation jobs.
 * Polls the AI provider for completion, downloads the video,
 * saves it to disk, and updates the generation record.
 *
 * On failure: updates status to FAILED and refunds credits.
 */

import { Worker, type ConnectionOptions } from 'bullmq';
import { logger } from '@libs/logger.js';
import { aiProviderRegistry } from '@libs/ai/index.js';
import { fileStorageService } from '@libs/storage/file-storage.service.js';
import { creditsService } from '@modules/credits/credits.service.js';
import * as generationsRepo from '@modules/generations/generations.repo.js';
import { getBullRedis } from '@libs/queue/queue.js';
import { VIDEO_GENERATION_QUEUE } from '@libs/queue/video-generation.queue.js';
import type { VideoGenerationJobData } from '@libs/queue/video-generation.queue.js';

const POLL_INTERVAL_MS = 10_000; // 10 seconds between polls
const MAX_POLL_DURATION_MS = 10 * 60 * 1000; // 10 minutes max

let worker: Worker<VideoGenerationJobData> | null = null;

async function processVideoGeneration(jobData: VideoGenerationJobData): Promise<void> {
  const { generationId, userId, operationId, providerKey, creditsCost } = jobData;

  logger.info({
    generationId,
    operationId,
    providerKey,
  }, '[VIDEO_WORKER] Processing video generation job');

  const provider = aiProviderRegistry.getVideo(providerKey);
  const startTime = jobData.startedAt;
  let lastPollTime = Date.now();

  // Poll until done or timeout
  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_POLL_DURATION_MS) {
      throw new Error(`Video generation timed out after ${Math.round(elapsed / 1000)}s`);
    }

    // Wait before polling (except first iteration)
    const timeSinceLastPoll = Date.now() - lastPollTime;
    if (timeSinceLastPoll < POLL_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS - timeSinceLastPoll));
    }
    lastPollTime = Date.now();

    const result = await provider.pollVideoGeneration(operationId);

    if (!result.done) {
      logger.debug({
        generationId,
        operationId,
        elapsedMs: elapsed,
      }, '[VIDEO_WORKER] Video still processing');
      continue;
    }

    // Generation is done
    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.videoBuffer) {
      throw new Error('Video generation completed but no video buffer returned');
    }

    // Save the video file
    const { url: outputVideoUrl } = await fileStorageService.saveGenerationVideoOutput(
      generationId,
      result.videoBuffer,
    );

    const processingTimeMs = Date.now() - startTime;

    // Update generation status to COMPLETED
    await generationsRepo.updateStatus(generationId, 'COMPLETED', {
      outputVideoUrl,
      processingTimeMs,
    });

    logger.info({
      generationId,
      processingTimeMs,
      videoSize: result.videoBuffer.length,
    }, '[VIDEO_WORKER] Video generation completed successfully');

    return;
  }
}

/**
 * Starts the video generation BullMQ worker.
 * Should be called during app startup.
 */
export function startVideoGenerationWorker(): Worker<VideoGenerationJobData> {
  if (worker) {
    return worker;
  }

  worker = new Worker<VideoGenerationJobData>(
    VIDEO_GENERATION_QUEUE,
    async (job) => {
      await processVideoGeneration(job.data);
    },
    {
      connection: getBullRedis() as unknown as ConnectionOptions,
      concurrency: 3,
    },
  );

  worker.on('completed', (job) => {
    logger.info({
      jobId: job.id,
      generationId: job.data.generationId,
    }, '[VIDEO_WORKER] Job completed');
  });

  worker.on('failed', async (job, error) => {
    if (!job) {
      logger.error({ err: error }, '[VIDEO_WORKER] Job failed with no job reference');
      return;
    }

    const { generationId, userId, creditsCost } = job.data;

    logger.error({
      err: error,
      jobId: job.id,
      generationId,
      attemptsMade: job.attemptsMade,
    }, '[VIDEO_WORKER] Job failed');

    // Only handle final failure (after all retries exhausted)
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      try {
        // Update generation status to FAILED
        await generationsRepo.updateStatus(generationId, 'FAILED', {
          errorMessage: error.message,
        });

        // Refund credits
        await creditsService.refundCredits(userId, creditsCost, generationId);

        logger.info({
          generationId,
          userId,
          creditsCost,
        }, '[VIDEO_WORKER] Credits refunded after final failure');
      } catch (refundError) {
        logger.error({
          err: refundError,
          generationId,
          userId,
          creditsCost,
        }, '[VIDEO_WORKER] Failed to refund credits after job failure');
      }
    }
  });

  worker.on('error', (error) => {
    logger.error({ err: error }, '[VIDEO_WORKER] Worker error');
  });

  logger.info('[VIDEO_WORKER] Video generation worker started');

  return worker;
}

/**
 * Gracefully shuts down the video generation worker.
 */
export async function stopVideoGenerationWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('[VIDEO_WORKER] Video generation worker stopped');
  }
}
