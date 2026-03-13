import { v4 as uuidv4 } from 'uuid';
import { getRedis } from '@libs/redis.js';
import { parseDurationMs } from '@libs/auth.js';
import { env } from '@config/env.js';

const VERIFICATION_PREFIX = 'email_verification:';
const COOLDOWN_PREFIX = 'email_verification_cooldown:';
const COOLDOWN_SECONDS = 60;

const PASSWORD_RESET_PREFIX = 'password_reset:';
const PASSWORD_RESET_COOLDOWN_PREFIX = 'password_reset_cooldown:';
const PASSWORD_RESET_TTL_SECONDS = 60 * 60; // 1 hour

function getTokenTtlSeconds(): number {
  const ms = parseDurationMs(env.EMAIL_VERIFICATION_TOKEN_EXPIRY, 24 * 60 * 60 * 1000);
  return Math.floor(ms / 1000);
}

export async function createVerificationToken(userId: string): Promise<string> {
  const redis = getRedis();
  const token = uuidv4();
  const ttl = getTokenTtlSeconds();

  await redis.set(`${VERIFICATION_PREFIX}${token}`, userId, 'EX', ttl);

  return token;
}

export async function getVerificationTokenUserId(token: string): Promise<string | null> {
  const redis = getRedis();
  const key = `${VERIFICATION_PREFIX}${token}`;

  // Get and delete atomically (single-use token)
  const userId = await redis.get(key);
  if (userId) {
    await redis.del(key);
  }

  return userId;
}

export async function isResendOnCooldown(userId: string): Promise<boolean> {
  const redis = getRedis();
  const result = await redis.exists(`${COOLDOWN_PREFIX}${userId}`);
  return result === 1;
}

export async function setResendCooldown(userId: string): Promise<void> {
  const redis = getRedis();
  await redis.set(`${COOLDOWN_PREFIX}${userId}`, '1', 'EX', COOLDOWN_SECONDS);
}

// ─── Password Reset Tokens ────────────────────────────────────

export async function createPasswordResetToken(userId: string): Promise<string> {
  const redis = getRedis();
  const token = uuidv4();

  await redis.set(`${PASSWORD_RESET_PREFIX}${token}`, userId, 'EX', PASSWORD_RESET_TTL_SECONDS);

  return token;
}

export async function getPasswordResetTokenUserId(token: string): Promise<string | null> {
  const redis = getRedis();
  const key = `${PASSWORD_RESET_PREFIX}${token}`;

  // Get and delete atomically (single-use token)
  const userId = await redis.get(key);
  if (userId) {
    await redis.del(key);
  }

  return userId;
}

export async function isPasswordResetOnCooldown(email: string): Promise<boolean> {
  const redis = getRedis();
  const result = await redis.exists(`${PASSWORD_RESET_COOLDOWN_PREFIX}${email}`);
  return result === 1;
}

export async function setPasswordResetCooldown(email: string): Promise<void> {
  const redis = getRedis();
  await redis.set(`${PASSWORD_RESET_COOLDOWN_PREFIX}${email}`, '1', 'EX', COOLDOWN_SECONDS);
}
