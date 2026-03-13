import type React from 'react';
import type { Metadata } from 'next';

import { ResetPassword } from '@/features/auth/components/ResetPassword';
import { APP_NAME } from '@/lib/constants/app.constants';

export const metadata: Metadata = {
  title: `Reset password — ${APP_NAME}`,
  description: 'Reset your account password',
};

export default function ResetPasswordPage(): React.ReactElement {
  return <ResetPassword />;
}
