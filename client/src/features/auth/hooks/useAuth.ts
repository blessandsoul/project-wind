'use client';

import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getErrorMessage } from '@/lib/utils/error';
import { ROUTES } from '@/lib/constants/routes';
import { authService } from '../services/auth.service';
import { setUser, setLoggingOut, logout as logoutAction } from '../store/authSlice';

import type { ILoginRequest, IRegisterRequest, IUser } from '../types/auth.types';

interface UseAuthReturn {
  user: IUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (data: ILoginRequest) => void;
  register: (data: IRegisterRequest) => void;
  googleAuth: (accessToken: string) => void;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isGoogleAuthPending: boolean;
  isLoggingOut: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isInitializing, isLoggingOut } = useAppSelector((state) => state.auth);

  const loginMutation = useMutation({
    mutationFn: (data: ILoginRequest) => authService.login(data),
    onSuccess: (data) => {
      dispatch(setUser(data.user));

      if (!data.user.emailVerified) {
        router.push(ROUTES.VERIFY_EMAIL);
        return;
      }

      toast.success('Signed in successfully');
      const from = searchParams.get('from');
      const redirectTo = from && from.startsWith('/') && !from.startsWith('//') ? from : ROUTES.DASHBOARD;
      router.push(redirectTo);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: IRegisterRequest) => authService.register(data),
    onSuccess: (data) => {
      dispatch(setUser(data.user));
      toast.success('Account created! Check your email to verify.');
      router.push(ROUTES.VERIFY_EMAIL);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const googleAuthMutation = useMutation({
    mutationFn: (accessToken: string) => authService.googleAuth({ accessToken }),
    onSuccess: (data) => {
      dispatch(setUser(data.user));
      toast.success('Signed in with Google');
      const from = searchParams.get('from');
      const redirectTo = from && from.startsWith('/') && !from.startsWith('//') ? from : ROUTES.DASHBOARD;
      router.push(redirectTo);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const logout = useCallback(async (): Promise<void> => {
    dispatch(setLoggingOut(true));
    try {
      await authService.logout();
    } catch {
      // Proceed with local logout even if server call fails
    } finally {
      dispatch(logoutAction());
      router.push(ROUTES.LOGIN);
    }
  }, [dispatch, router]);

  return {
    user,
    isAuthenticated,
    isInitializing,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    googleAuth: googleAuthMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isGoogleAuthPending: googleAuthMutation.isPending,
    isLoggingOut,
  };
};
