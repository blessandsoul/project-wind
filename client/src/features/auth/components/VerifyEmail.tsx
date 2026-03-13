'use client';

import type React from 'react';
import { useEffect, useState, useCallback } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { authService } from '../services/auth.service';
import { getErrorMessage } from '@/lib/utils/error';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

type VerifyState = 'waiting' | 'success' | 'error';

function resolveInitialState(status: string | null): VerifyState {
  if (status === 'success') return 'success';
  if (status === 'error') return 'error';
  return 'waiting';
}

function resolveErrorMessage(reason: string | null): string {
  if (reason === 'expired') return 'Your verification link has expired. Request a new one below.';
  return 'The verification link is invalid. Request a new one below.';
}

export const VerifyEmail = (): React.ReactElement => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The server redirects here with ?status=success or ?status=error&reason=expired|invalid
  const status = searchParams.get('status');
  const reason = searchParams.get('reason');
  const { user } = useAppSelector((state) => state.auth);

  const [state] = useState<VerifyState>(() => resolveInitialState(status));
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return (): void => clearInterval(interval);
  }, [resendCooldown]);

  const handleResend = useCallback(async (): Promise<void> => {
    setIsResending(true);
    try {
      await authService.resendVerification();
      toast.success('Verification email sent');
      setResendCooldown(60);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  }, []);

  const resendButton = (
    <Button
      variant={state === 'error' ? 'default' : 'outline'}
      className={cn('w-full', resendCooldown > 0 && 'opacity-60')}
      onClick={handleResend}
      disabled={isResending || resendCooldown > 0}
    >
      {isResending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : resendCooldown > 0 ? (
        `Resend in ${resendCooldown}s`
      ) : (
        'Resend verification email'
      )}
    </Button>
  );

  const maskedEmail = user?.email
    ? user.email.replace(/^(.{2})(.*)(@.*)$/, (_, start, middle, domain) =>
        `${start as string}${'*'.repeat(Math.min((middle as string).length, 6))}${domain as string}`
      )
    : '';

  // State: verification succeeded (server redirected with ?status=success)
  if (state === 'success') {
    return (
      <div className="flex flex-col items-center space-y-6 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Email verified</h1>
          <p className="text-sm text-muted-foreground">
            Your account is ready. You can now access all features.
          </p>
        </div>
        <Button className="w-full" onClick={() => router.push(ROUTES.LOGIN)}>
          Sign in
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  // State: verification failed (server redirected with ?status=error&reason=...)
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center space-y-6 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Verification failed</h1>
          <p className="text-sm text-muted-foreground">
            {resolveErrorMessage(reason)}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          {resendButton}
          <Button variant="ghost" className="w-full" onClick={() => router.push(ROUTES.LOGIN)}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  // State: waiting — user just registered, needs to check their inbox
  return (
    <div className="flex flex-col items-center space-y-6 py-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Mail className="h-7 w-7 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to{' '}
          {maskedEmail ? (
            <span className="font-medium text-foreground">{maskedEmail}</span>
          ) : (
            'your email address'
          )}
        </p>
      </div>

      <div className="w-full space-y-3">
        <p className="text-xs text-muted-foreground">
          Click the link in the email to verify your account. If you don&apos;t see it, check your spam folder.
        </p>

        {resendButton}

        <Button variant="ghost" className="w-full" onClick={() => router.push(ROUTES.LOGIN)}>
          Back to sign in
        </Button>
      </div>
    </div>
  );
};
