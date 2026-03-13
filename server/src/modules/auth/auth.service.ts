import { signAccessToken, generateRefreshToken, getRefreshTokenExpiresAt } from '@libs/auth.js';
import { hashPassword, verifyPassword } from '@libs/password.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '@libs/email.js';
import {
  createVerificationToken,
  getVerificationTokenUserId,
  isResendOnCooldown,
  setResendCooldown,
  createPasswordResetToken,
  getPasswordResetTokenUserId,
  isPasswordResetOnCooldown,
  setPasswordResetCooldown,
} from '@libs/verification.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '@shared/errors/errors.js';
import type { UserRole } from '@shared/types/index.js';
import { logger } from '@libs/logger.js';
import { creditsService } from '@modules/credits/credits.service.js';
import * as authRepo from './auth.repo.js';
import { sessionRepository } from './session.repo.js';
import { verifyGoogleAccessToken } from '@libs/google.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

// Account lockout configuration
const LOCKOUT_THRESHOLDS = [
  { attempts: 5, durationMs: 15 * 60 * 1000 },   // 5 failures → 15 min
  { attempts: 10, durationMs: 30 * 60 * 1000 },   // 10 failures → 30 min
  { attempts: 15, durationMs: 60 * 60 * 1000 },   // 15+ failures → 1 hour
];

function getLockoutDuration(failedAttempts: number): number | null {
  for (let i = LOCKOUT_THRESHOLDS.length - 1; i >= 0; i--) {
    if (failedAttempts >= LOCKOUT_THRESHOLDS[i].attempts) {
      return LOCKOUT_THRESHOLDS[i].durationMs;
    }
  }
  return null;
}

interface SanitizedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthResult {
  user: SanitizedUser;
  accessToken: string;
  refreshToken: string;
}

function sanitizeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SanitizedUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function register(
  input: RegisterInput,
  deviceInfo?: string,
  ipAddress?: string,
): Promise<AuthResult> {
  const existingUser = await authRepo.findUserByEmail(input.email);
  if (existingUser) {
    throw new ConflictError('Email already registered', 'EMAIL_ALREADY_EXISTS');
  }

  // Check if a soft-deleted account exists with this email — direct them to login to restore
  const deletedUser = await authRepo.findDeletedUserByEmail(input.email);
  if (deletedUser) {
    throw new ConflictError(
      'An account with this email was recently deleted. Log in to restore it.',
      'EMAIL_ALREADY_EXISTS',
    );
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await authRepo.createUser({
    email: input.email,
    password: hashedPassword,
    firstName: input.firstName,
    lastName: input.lastName,
    emailVerified: false,
  });

  // Grant welcome bonus credits to new users
  await creditsService.grantWelcomeBonus(user.id);

  // Send verification email (fire-and-forget — don't block registration)
  createVerificationToken(user.id)
    .then((token) => sendVerificationEmail(user.email, token, user.firstName))
    .catch((err) => {
      logger.error({ err, userId: user.id }, 'Failed to send verification email during registration');
    });

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
  });
  const refreshToken = generateRefreshToken();
  const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

  await authRepo.createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: refreshTokenExpiresAt,
  });

  await sessionRepository.createSession({
    userId: user.id,
    deviceInfo,
    ipAddress,
    expiresAt: refreshTokenExpiresAt,
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

export async function login(
  input: LoginInput,
  deviceInfo?: string,
  ipAddress?: string,
): Promise<AuthResult> {
  let user = await authRepo.findUserByEmail(input.email);

  // If no active user found, check for a soft-deleted account that can be restored
  if (!user) {
    const deletedUser = await authRepo.findDeletedUserByEmail(input.email);
    if (!deletedUser) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Google-only users have no password — can't restore via email/password login
    if (!deletedUser.password) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Verify password before restoring — don't restore on wrong password
    const validPassword = await verifyPassword(input.password, deletedUser.password);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Restore account: clears deletedAt, sets isActive = true, resets lockout
    await authRepo.restoreUser(deletedUser.id);
    user = { ...deletedUser, deletedAt: null, isActive: true, failedLoginAttempts: 0, lockedUntil: null };
  } else {
    // Normal login flow for active accounts

    // Generic error for disabled accounts — prevent info leakage
    if (!user.isActive) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Google-only users have no password — can't login via email/password
    if (!user.password) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const valid = await verifyPassword(input.password, user.password);

    if (!valid) {
      // Increment failed attempts
      const newAttempts = user.failedLoginAttempts + 1;
      await authRepo.incrementFailedAttempts(user.id);

      // Check if we need to lock the account
      const lockDuration = getLockoutDuration(newAttempts);
      if (lockDuration) {
        await authRepo.setAccountLock(user.id, new Date(Date.now() + lockDuration));
      }

      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Successful login — reset failed attempts
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await authRepo.resetFailedAttempts(user.id);
    }
  }

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
  });
  const refreshToken = generateRefreshToken();
  const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

  await authRepo.createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: refreshTokenExpiresAt,
  });

  await sessionRepository.createSession({
    userId: user.id,
    deviceInfo,
    ipAddress,
    expiresAt: refreshTokenExpiresAt,
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const storedToken = await authRepo.findRefreshToken(refreshToken);
  if (!storedToken) {
    throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  if (new Date() > storedToken.expiresAt) {
    await authRepo.deleteRefreshToken(refreshToken);
    throw new UnauthorizedError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
  }

  const user = await authRepo.findUserById(storedToken.userId);
  if (!user || !user.isActive) {
    throw new UnauthorizedError('User not found or disabled', 'INVALID_REFRESH_TOKEN');
  }

  const newAccessToken = signAccessToken({
    userId: user.id,
    role: user.role,
  });
  const newRefreshToken = generateRefreshToken();

  // Atomic rotation: delete old + create new in a single transaction.
  // Returns false if old token was already consumed by a concurrent request.
  const rotated = await authRepo.rotateRefreshToken(refreshToken, {
    token: newRefreshToken,
    userId: user.id,
    expiresAt: getRefreshTokenExpiresAt(),
  });

  if (!rotated) {
    throw new UnauthorizedError('Refresh token already used', 'INVALID_REFRESH_TOKEN');
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    // Find the token before deleting so we can match the corresponding session
    const storedToken = await authRepo.findRefreshToken(refreshToken);
    await authRepo.deleteRefreshToken(refreshToken);

    if (storedToken) {
      // Match session by creation time — token and session are created together during login
      const sessions = await sessionRepository.getUserSessions(storedToken.userId);
      const tokenCreatedMs = storedToken.createdAt.getTime();
      const matchingSession = sessions.find(
        (s) => Math.abs(s.createdAt.getTime() - tokenCreatedMs) < 5000,
      );

      if (matchingSession) {
        await sessionRepository.deleteSession(matchingSession.id);
      }
    }
  } catch {
    // Token may already be deleted by concurrent request or cleanup job
  }
}

export async function getCurrentUser(userId: string): Promise<SanitizedUser> {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  return sanitizeUser(user);
}

interface SessionInfo {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
}

export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  const sessions = await sessionRepository.getUserSessions(userId);
  return sessions.map((session) => ({
    id: session.id,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
    lastActiveAt: session.lastActiveAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
  }));
}

export async function logoutAllSessions(userId: string): Promise<number> {
  const sessionCount = await sessionRepository.deleteAllUserSessions(userId);
  await authRepo.deleteRefreshTokensByUserId(userId);
  return sessionCount;
}

export async function verifyEmail(token: string): Promise<SanitizedUser> {
  const userId = await getVerificationTokenUserId(token);
  if (!userId) {
    throw new BadRequestError('Invalid or expired verification token', 'INVALID_VERIFICATION_TOKEN');
  }

  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Idempotent — if already verified, just return the user
  if (user.emailVerified) {
    return sanitizeUser(user);
  }

  await authRepo.setEmailVerified(userId);

  return sanitizeUser({ ...user, emailVerified: true });
}

export async function resendVerificationEmail(userId: string): Promise<void> {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  if (user.emailVerified) {
    throw new BadRequestError('Email already verified', 'ALREADY_VERIFIED');
  }

  const onCooldown = await isResendOnCooldown(userId);
  if (onCooldown) {
    throw new BadRequestError('Please wait before requesting another verification email', 'RESEND_COOLDOWN');
  }

  const token = await createVerificationToken(userId);
  await setResendCooldown(userId);
  await sendVerificationEmail(user.email, token, user.firstName);
}

export async function requestPasswordReset(email: string): Promise<void> {
  // Always return success to prevent email enumeration
  const user = await authRepo.findUserByEmail(email);
  if (!user) return;

  const onCooldown = await isPasswordResetOnCooldown(email);
  if (onCooldown) return;

  const token = await createPasswordResetToken(user.id);
  await setPasswordResetCooldown(email);
  await sendPasswordResetEmail(user.email, token, user.firstName);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const userId = await getPasswordResetTokenUserId(token);
  if (!userId) {
    throw new BadRequestError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
  }

  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  const hashedPassword = await hashPassword(newPassword);
  await authRepo.updateUserPassword(userId, hashedPassword);

  // Invalidate all sessions so user must log in with new password
  await sessionRepository.deleteAllUserSessions(userId);
  await authRepo.deleteRefreshTokensByUserId(userId);
}

export async function googleAuth(
  credential: string,
  deviceInfo?: string,
  ipAddress?: string,
): Promise<AuthResult> {
  const googleUser = await verifyGoogleAccessToken(credential);

  // Fast path: returning Google user (lookup by googleId)
  let user = await authRepo.findUserByGoogleId(googleUser.googleId);

  if (!user) {
    // Check if an active user exists with the same email (account linking)
    const existingUser = await authRepo.findUserByEmail(googleUser.email);

    if (existingUser) {
      if (!existingUser.isActive) {
        throw new UnauthorizedError('Account is disabled', 'INVALID_CREDENTIALS');
      }

      // Link Google account — don't overwrite existing avatar
      user = await authRepo.linkGoogleAccount(
        existingUser.id,
        googleUser.googleId,
        existingUser.avatarUrl ? undefined : googleUser.avatarUrl,
      );
    } else {
      // Check for soft-deleted account with this email
      const deletedUser = await authRepo.findDeletedUserByEmail(googleUser.email);

      if (deletedUser) {
        // Restore and link
        await authRepo.restoreUser(deletedUser.id);
        user = await authRepo.linkGoogleAccount(
          deletedUser.id,
          googleUser.googleId,
          deletedUser.avatarUrl ? undefined : googleUser.avatarUrl,
        );
      } else {
        // Brand new user — create without password
        user = await authRepo.createUser({
          email: googleUser.email,
          firstName: googleUser.firstName || 'User',
          lastName: googleUser.lastName || '',
          emailVerified: true,
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl,
        });

        await creditsService.grantWelcomeBonus(user.id);
      }
    }
  } else {
    // User found by googleId — check active status
    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled', 'INVALID_CREDENTIALS');
    }
  }

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
  });
  const refreshToken = generateRefreshToken();
  const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

  await authRepo.createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: refreshTokenExpiresAt,
  });

  await sessionRepository.createSession({
    userId: user.id,
    deviceInfo,
    ipAddress,
    expiresAt: refreshTokenExpiresAt,
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}
