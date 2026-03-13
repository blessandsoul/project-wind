import type React from 'react';
import type { Metadata } from 'next';

import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { APP_NAME } from '@/lib/constants/app.constants';

export const metadata: Metadata = {
  title: `Create account — ${APP_NAME}`,
  description: 'Create a new account to get started',
};

export default function RegisterPage(): React.ReactElement {
  return <RegisterForm />;
}
