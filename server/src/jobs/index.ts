/**
 * Jobs Registry
 *
 * Registers all background jobs with the Fastify instance.
 * Each job manages its own interval and cleanup via onClose hook.
 */

import type { FastifyInstance } from 'fastify';
import { startCleanupExpiredAuthJob } from './cleanup-expired-auth.job.js';
import { startCleanupDeletedAccountsJob } from './cleanup-deleted-accounts.job.js';
import { startVideoGenerationWorker, stopVideoGenerationWorker } from '../workers/video-generation.worker.js';
import { connectBullRedis, disconnectBullRedis } from '@libs/queue/queue.js';
import { logger } from '@libs/logger.js';

/**
 * Registers all background jobs
 *
 * @param app - Fastify instance (used for onClose cleanup hooks)
 */
export async function registerJobs(app: FastifyInstance): Promise<void> {
  // Interval-based cleanup jobs
  startCleanupExpiredAuthJob(app);
  startCleanupDeletedAccountsJob(app);

  // BullMQ workers (require dedicated Redis connection)
  const bullConnected = await connectBullRedis();
  if (bullConnected) {
    startVideoGenerationWorker();

    app.addHook('onClose', async () => {
      await stopVideoGenerationWorker();
      await disconnectBullRedis();
    });
  } else {
    logger.warn('[JOBS] BullMQ Redis not connected — video generation worker disabled');
  }
}
