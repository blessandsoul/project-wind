import { httpClient } from '@libs/http.js';
import { UnauthorizedError } from '@shared/errors/errors.js';

export interface GoogleUserPayload {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

interface GoogleUserInfoResponse {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function verifyGoogleAccessToken(accessToken: string): Promise<GoogleUserPayload> {
  try {
    const response = await httpClient.get<GoogleUserInfoResponse>(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const payload = response.data;
    if (!payload.email) {
      throw new UnauthorizedError('Invalid Google token', 'INVALID_GOOGLE_TOKEN');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      avatarUrl: payload.picture || null,
      emailVerified: payload.email_verified ?? true,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Google authentication failed', 'INVALID_GOOGLE_TOKEN');
  }
}
