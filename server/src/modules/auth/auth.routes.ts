import type { FastifyInstance } from 'fastify';
import { authenticate } from '@libs/auth.js';
import { RATE_LIMITS } from '@config/rate-limit.config.js';
import * as authController from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  googleAuthSchema,
} from './auth.schemas.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Register - Strict rate limiting to prevent abuse
  fastify.post('/auth/register', {
    schema: {
      body: registerSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AUTH_REGISTER,
    },
    handler: authController.register,
  });

  // Login - Strict rate limiting to prevent brute force
  fastify.post('/auth/login', {
    schema: {
      body: loginSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AUTH_LOGIN,
    },
    handler: authController.login,
  });

  // Logout - reads refresh token from cookie, no body schema needed
  fastify.post('/auth/logout', {
    config: {
      rateLimit: RATE_LIMITS.AUTH_LOGOUT,
    },
    handler: authController.logout,
  });

  // Refresh token - reads refresh token from cookie, no body schema needed
  fastify.post('/auth/refresh', {
    config: {
      rateLimit: RATE_LIMITS.AUTH_REFRESH,
    },
    handler: authController.refresh,
  });

  // Get current user
  fastify.get('/auth/me', {
    preValidation: [authenticate],
    config: {
      rateLimit: RATE_LIMITS.AUTH_ME,
    },
    handler: authController.me,
  });

  // Get user sessions
  fastify.get('/auth/sessions', {
    preValidation: [authenticate],
    config: {
      rateLimit: RATE_LIMITS.AUTH_SESSIONS,
    },
    handler: authController.getSessions,
  });

  // Logout from all sessions
  fastify.post('/auth/logout-all', {
    preValidation: [authenticate],
    config: {
      rateLimit: RATE_LIMITS.AUTH_LOGOUT_ALL,
    },
    handler: authController.logoutAllSessions,
  });

  // Verify email - public, token-based (no auth needed)
  fastify.get('/auth/verify-email', {
    schema: {
      querystring: verifyEmailSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AUTH_VERIFY_EMAIL,
    },
    handler: authController.verifyEmail,
  });

  // Resend verification email - authenticated, rate limited
  fastify.post('/auth/resend-verification', {
    preValidation: [authenticate],
    config: {
      rateLimit: RATE_LIMITS.AUTH_RESEND_VERIFICATION,
    },
    handler: authController.resendVerification,
  });

  // Request password reset - public, rate limited
  fastify.post('/auth/request-password-reset', {
    schema: {
      body: requestPasswordResetSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AUTH_REQUEST_PASSWORD_RESET,
    },
    handler: authController.requestPasswordReset,
  });

  // Google OAuth - verify ID token and login/register
  fastify.post('/auth/google', {
    schema: {
      body: googleAuthSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AUTH_GOOGLE,
    },
    handler: authController.googleAuth,
  });

  // Reset password - public, token-based
  fastify.post('/auth/reset-password', {
    schema: {
      body: resetPasswordSchema,
    },
    config: {
      rateLimit: RATE_LIMITS.AUTH_RESET_PASSWORD,
    },
    handler: authController.resetPassword,
  });

}
