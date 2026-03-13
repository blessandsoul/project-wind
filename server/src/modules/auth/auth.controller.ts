import type { FastifyRequest, FastifyReply } from 'fastify';
import { successResponse } from '@shared/responses/successResponse.js';
import { UnauthorizedError } from '@shared/errors/errors.js';
import { setAuthCookies, clearAuthCookies } from '@libs/cookies.js';
import { env } from '@config/env.js';
import { logger } from '@libs/logger.js';
import type {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
  GoogleAuthInput,
} from './auth.schemas.js';
import * as authService from './auth.service.js';

export async function register(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply,
): Promise<void> {
  const deviceInfo = request.headers['user-agent'];
  const ipAddress = request.ip;

  const result = await authService.register(request.body, deviceInfo, ipAddress);

  setAuthCookies(reply, result.accessToken, result.refreshToken);
  reply.status(201).send(successResponse('User registered successfully', { user: result.user }));
}

export async function login(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply,
): Promise<void> {
  const deviceInfo = request.headers['user-agent'];
  const ipAddress = request.ip;

  const result = await authService.login(request.body, deviceInfo, ipAddress);

  setAuthCookies(reply, result.accessToken, result.refreshToken);
  reply.send(successResponse('Logged in successfully', { user: result.user }));
}

export async function refresh(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const refreshToken = request.cookies.refresh_token;
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token not provided', 'MISSING_REFRESH_TOKEN');
  }

  const tokens = await authService.refresh(refreshToken);

  setAuthCookies(reply, tokens.accessToken, tokens.refreshToken);
  reply.send(successResponse('Token refreshed successfully', null));
}

export async function logout(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const refreshToken = request.cookies.refresh_token;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  clearAuthCookies(reply);
  reply.send(successResponse('Logged out successfully', null));
}

export async function me(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = await authService.getCurrentUser(request.user.userId);
  reply.send(successResponse('Current user retrieved', user));
}

export async function getSessions(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const sessions = await authService.getUserSessions(request.user.userId);
  reply.send(successResponse('User sessions retrieved', sessions));
}

export async function logoutAllSessions(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const count = await authService.logoutAllSessions(request.user.userId);
  clearAuthCookies(reply);
  reply.send(
    successResponse(`Successfully logged out from ${count} session(s)`, { count }),
  );
}

export async function verifyEmail(
  request: FastifyRequest<{ Querystring: VerifyEmailInput }>,
  reply: FastifyReply,
): Promise<void> {
  const { token } = request.query;

  try {
    await authService.verifyEmail(token);
    reply.redirect(`${env.CLIENT_URL}/verify-email?status=success`);
  } catch (err) {
    const reason = err instanceof Error && 'code' in err
      ? (err as { code: string }).code === 'INVALID_VERIFICATION_TOKEN' ? 'expired' : 'invalid'
      : 'invalid';
    logger.warn({ err, token: token.slice(0, 8) + '...' }, 'Email verification failed');
    reply.redirect(`${env.CLIENT_URL}/verify-email?status=error&reason=${reason}`);
  }
}

export async function resendVerification(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authService.resendVerificationEmail(request.user.userId);
  reply.send(successResponse('Verification email sent', null));
}

export async function requestPasswordReset(
  request: FastifyRequest<{ Body: RequestPasswordResetInput }>,
  reply: FastifyReply,
): Promise<void> {
  await authService.requestPasswordReset(request.body.email);
  // Always return success to prevent email enumeration
  reply.send(successResponse('If an account exists with this email, a reset link has been sent', null));
}

export async function resetPassword(
  request: FastifyRequest<{ Body: ResetPasswordInput }>,
  reply: FastifyReply,
): Promise<void> {
  await authService.resetPassword(request.body.token, request.body.newPassword);
  reply.send(successResponse('Password reset successfully', null));
}

export async function googleAuth(
  request: FastifyRequest<{ Body: GoogleAuthInput }>,
  reply: FastifyReply,
): Promise<void> {
  const deviceInfo = request.headers['user-agent'];
  const ipAddress = request.ip;

  const result = await authService.googleAuth(request.body.accessToken, deviceInfo, ipAddress);

  setAuthCookies(reply, result.accessToken, result.refreshToken);
  reply.send(successResponse('Authenticated with Google successfully', { user: result.user }));
}
