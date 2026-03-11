/**
 * Video Generation Queue
 *
 * BullMQ queue for processing async video generation jobs.
 * Jobs are added when a user requests a video generation,
 * and processed by the video generation worker.
 */

import { createQueue } from './queue.js';

export const VIDEO_GENERATION_QUEUE = 'video-generation';

export interface VideoGenerationJobData {
  generationId: string;
  userId: string;
  operationId: string;
  providerKey: string;
  creditsCost: number;
  startedAt: number; // Date.now() when job was queued
}

export const videoGenerationQueue = createQueue<VideoGenerationJobData>(VIDEO_GENERATION_QUEUE);
