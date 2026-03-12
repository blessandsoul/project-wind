import type React from 'react';
import type { Metadata } from 'next';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { APP_NAME } from '@/lib/constants/app.constants';
import { ROUTES } from '@/lib/constants/routes';
import { Hero } from '@/features/landing/components/Hero';
import { HowItWorks } from '@/features/landing/components/HowItWorks';
import { TemplateShowcase } from '@/features/landing/components/TemplateShowcase';
import { PromptToResult } from '@/features/landing/components/PromptToResult';
import { Testimonials } from '@/features/landing/components/Testimonials';
import { FAQ } from '@/features/landing/components/FAQ';
import { FinalCTA } from '@/features/landing/components/FinalCTA';
import { ScrollReveal } from '@/features/landing/components/ScrollReveal';
import { StickyMobileCTA } from '@/features/landing/components/StickyMobileCTA';

export const metadata: Metadata = {
  title: `${APP_NAME} — AI Content Generation Platform`,
  description:
    'Create stunning images and videos with AI. Browse templates, configure your vision, and generate professional content in seconds.',
  openGraph: {
    title: `${APP_NAME} — AI Content Generation Platform`,
    description: 'Create stunning images and videos with AI.',
    type: 'website',
  },
};

export default async function LandingPage(): Promise<React.ReactElement> {
  const cookieStore = await cookies();
  const hasSession = cookieStore.get('access_token');

  if (hasSession) {
    redirect(ROUTES.DASHBOARD);
  }

  return (
    <>
      <Hero />

      <HowItWorks />

      <ScrollReveal>
        <TemplateShowcase />
      </ScrollReveal>

      <ScrollReveal>
        <PromptToResult />
      </ScrollReveal>

      <ScrollReveal>
        <Testimonials />
      </ScrollReveal>

      <ScrollReveal>
        <FAQ />
      </ScrollReveal>

      <FinalCTA />
      <StickyMobileCTA />
    </>
  );
}
