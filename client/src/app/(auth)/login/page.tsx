import type React from 'react';
import type { Metadata } from 'next';

import { LoginForm } from '@/features/auth/components/LoginForm';
import { APP_NAME } from '@/lib/constants/app.constants';

export const metadata: Metadata = {
  title: `Sign in — ${APP_NAME}`,
  description: 'Sign in to your account',
};

export default function LoginPage(): React.ReactElement {
  return <LoginForm />;
}
