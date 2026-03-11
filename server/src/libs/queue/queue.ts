/**
 * BullMQ Queue Infrastructure
 *
 * Provides a dedicated Redis connection for BullMQ (requires maxRetriesPerRequest: null)
 * and a factory for creating queues.
 */

import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '@config/env.js';
import { logger } from '@libs/logger.js';

let bullRedis: Redis | null = null;

/**
 * Gets or creates a dedicated Redis connection for BullMQ.
 * BullMQ requires maxRetriesPerRequest: null, which conflicts with
 * the main Redis instance used for rate limiting and caching.
 */
export function getBullRedis(): Redis {
  if (!bullRedis) {
    bullRedis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      connectTimeout: env.REDIS_CONNECT_TIMEOUT,
      lazyConnect: true,
    });

    bullRedis.on('connect', () => {
      logger.info('[QUEUE] BullMQ Redis connection established');
    });

    bullRedis.on('error', (error: Error) => {
      logger.warn({ err: error }, '[QUEUE] BullMQ Redis connection error');
    });
  }

  return bullRedis;
}

/**
 * Connects the BullMQ Redis instance.
 * Should be called during app startup.
 */
export async function connectBullRedis(): Promise<boolean> {
  try {
    const client = getBullRedis();
    if (client.status === 'ready' || client.status === 'connect') {
      return true;
    }
    await client.connect();
    return true;
  } catch (error) {
    logger.warn('[QUEUE] BullMQ Redis connection failed — video generation will not work');
    logger.debug(error);
    return false;
  }
}

/**
 * Disconnects the BullMQ Redis instance.
 * Should be called during graceful shutdown.
 */
export async function disconnectBullRedis(): Promise<void> {
  if (bullRedis) {
    await bullRedis.quit();
    bullRedis = null;
    logger.info('[QUEUE] BullMQ Redis disconnected');
  }
}

/**
 * Creates a new BullMQ Queue with the shared BullMQ Redis connection.
 */
export function createQueue<T>(name: string): Queue<T> {
  // Cast needed: BullMQ bundles its own ioredis, causing type mismatch
  // with the project's ioredis. Functionally identical at runtime.
  return new Queue<T>(name, { connection: getBullRedis() as unknown as import('bullmq').ConnectionOptions });
}
