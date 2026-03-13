import type { Metadata } from 'next';
import type React from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';

import { Providers } from './providers';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';
import { APP_NAME } from '@/lib/constants/app.constants';
import { DEFAULT_THEME } from '@/styles/colors';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'A full-stack application built with Next.js and Fastify',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" data-theme={String(DEFAULT_THEME)} suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <ThemeSwitcher />
        </Providers>
      </body>
    </html>
  );
}
