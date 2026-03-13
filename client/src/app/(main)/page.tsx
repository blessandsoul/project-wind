import type React from 'react';
import type { Metadata } from 'next';

import { APP_NAME } from '@/lib/constants/app.constants';
import { Hero } from '@/features/landing/components/Hero';
import { FeatureHighlights } from '@/features/landing/components/FeatureHighlights';
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

export default function LandingPage(): React.ReactElement {
  return (
    <>
      <Hero />

      <FeatureHighlights />

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
