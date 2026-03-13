import type React from 'react';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { APP_NAME } from '@/lib/constants/app.constants';
import { ROUTES } from '@/lib/constants/routes';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Subtle gradient background */}
      <div className="hero-gradient pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
      <div className="hero-grid-pattern pointer-events-none fixed inset-0 -z-10 opacity-40" aria-hidden="true" />

      {/* Top bar */}
      <div className="container mx-auto flex items-center justify-between px-4 py-5 md:px-6">
        <Link
          href={ROUTES.HOME}
          className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 active:opacity-70 md:hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-150 md:group-hover:-translate-x-0.5" />
          Back
        </Link>
        <Link
          href={ROUTES.HOME}
          className="text-lg font-bold tracking-tight transition-colors duration-150 md:hover:text-primary"
        >
          {APP_NAME}
        </Link>
        {/* Invisible spacer for centering */}
        <div className="w-14" aria-hidden="true" />
      </div>

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-4 pb-12 pt-4 md:pb-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border/50 bg-card/80 px-6 py-8 shadow-sm backdrop-blur-sm md:px-8 md:py-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
