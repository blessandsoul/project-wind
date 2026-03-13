'use client';

import type React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Menu, X, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { APP_NAME } from '@/lib/constants/app.constants';
import { ROUTES } from '@/lib/constants/routes';

export const Header = (): React.ReactElement => {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { logout, isLoggingOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const toggleTheme = useCallback((): void => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const closeMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen(false);
    menuToggleRef.current?.focus();
  }, []);

  const toggleMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Close mobile menu on Escape key or outside click
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };

    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        menuToggleRef.current &&
        !menuToggleRef.current.contains(target)
      ) {
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="relative z-10 container mx-auto flex h-16 items-center justify-between bg-background/80 px-4 backdrop-blur-md md:px-6 lg:px-8">
        <Link
          href={ROUTES.HOME}
          className="text-xl font-bold tracking-tight transition-colors duration-150 hover:text-primary"
        >
          {APP_NAME}
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.DASHBOARD}>Dashboard</Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                {user?.firstName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                disabled={isLoggingOut}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.LOGIN}>Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={ROUTES.REGISTER}>Get started</Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="relative h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="relative h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>
          <Button
            ref={menuToggleRef}
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="relative h-9 w-9"
          >
            <Menu className={`absolute h-5 w-5 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
            <X className={`absolute h-5 w-5 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
          </Button>
        </div>
      </div>

      {/* Mobile menu panel — slides top-to-bottom */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        className={`absolute left-0 right-0 top-full z-[6] border-b border-border/50 bg-background shadow-xl transition-all duration-300 ease-out md:hidden ${
          isMobileMenuOpen
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" className="h-12 w-full justify-start text-base" asChild>
                <Link href={ROUTES.DASHBOARD} onClick={closeMobileMenu}>
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="h-12 w-full justify-start text-base"
                disabled={isLoggingOut}
                onClick={() => {
                  closeMobileMenu();
                  logout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="h-12 w-full justify-start text-base" asChild>
                <Link href={ROUTES.LOGIN} onClick={closeMobileMenu}>
                  Sign in
                </Link>
              </Button>
              <Button className="h-12 w-full text-base" asChild>
                <Link href={ROUTES.REGISTER} onClick={closeMobileMenu}>
                  Get started
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
