import type React from 'react';
import Image from 'next/image';

import { FEATURE_SECTIONS } from '../constants/landing.constants';
import { ScrollReveal } from './ScrollReveal';
import { cn } from '@/lib/utils';

export function FeatureHighlights(): React.ReactElement {
  return (
    <div className="flex flex-col">
      {FEATURE_SECTIONS.map((section, i) => {
        const isEven = i % 2 === 0;

        return (
          <ScrollReveal key={section.id}>
            <section
              aria-labelledby={`feature-${section.id}`}
              className="py-16 md:py-24"
            >
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Desktop: side-by-side alternating. Mobile: stacked (text top, image bottom) */}
                <div
                  className={cn(
                    'flex flex-col gap-8 md:flex-row md:items-center md:gap-12 lg:gap-16',
                    !isEven && 'md:flex-row-reverse',
                  )}
                >
                  {/* Text block */}
                  <div className="md:w-1/2">
                    <h2
                      id={`feature-${section.id}`}
                      className="text-balance text-2xl font-bold leading-tight text-foreground md:text-3xl lg:text-4xl"
                    >
                      {section.heading}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground md:mt-6 md:text-lg">
                      {section.description}
                    </p>
                  </div>

                  {/* Image block */}
                  <div className="relative md:w-1/2">
                    {/* Subtle tinted background that peeks behind the image */}
                    <div
                      className={
                        isEven
                          ? 'absolute -inset-x-4 inset-y-4 rounded-3xl bg-primary/5 md:-inset-x-6 md:inset-y-6'
                          : 'absolute -inset-x-4 inset-y-4 rounded-3xl bg-accent/40 md:-inset-x-6 md:inset-y-6'
                      }
                      aria-hidden="true"
                    />

                    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={section.image}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
