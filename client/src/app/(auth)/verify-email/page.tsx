import type React from 'react';
import type { Metadata } from 'next';

import { VerifyEmail } from '@/features/auth/components/VerifyEmail';
import { APP_NAME } from '@/lib/constants/app.constants';

export const metadata: Metadata = {
  title: `Verify email — ${APP_NAME}`,
  description: 'Verify your email address to activate your account',
};

export default function VerifyEmailPage(): React.ReactElement {
  return <VerifyEmail />;
}
