'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';

import { ChevronDown } from 'lucide-react';

import { TemplateMock } from './mocks/TemplateMock';
import { ConfigureMock } from './mocks/ConfigureMock';
import { GenerateMock } from './mocks/GenerateMock';
import { HOW_IT_WORKS_STEPS } from '../constants/landing.constants';
import type { HowItWorksStep } from '../constants/landing.constants';
import { cn } from '@/lib/utils';

const MOCK_COMPONENTS: Record<number, React.FC<{ className?: string }>> = {
  1: TemplateMock,
  2: ConfigureMock,
  3: GenerateMock,
};

function StepSection({
  step,
  isVisible,
  isFirst,
  showChevron,
}: {
  step: HowItWorksStep;
  isVisible: boolean;
  isFirst: boolean;
  showChevron: boolean;
}): React.ReactElement {
  const MockComponent = MOCK_COMPONENTS[step.step];
  const isTextLeft = step.contentSide === 'left';

  return (
    <div
      role="group"
      aria-label={`Step ${step.step}: ${step.title}`}
      className="relative flex min-h-dvh snap-start items-center"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading on first step only */}
        {isFirst && (
          <div
            className={cn(
              'mb-12 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out',
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'motion-safe:opacity-0 motion-safe:translate-y-4',
            )}
          >
            <h2
              id="how-it-works-heading"
              className="text-center text-xl font-bold text-foreground md:text-2xl"
            >
              How it works
            </h2>
            <p className="mt-3 text-center text-muted-foreground">
              Three steps to your next masterpiece
            </p>
          </div>
        )}

        {/* Two-column layout */}
        <div
          className={cn(
            'flex flex-col items-center gap-8 md:flex-row md:gap-16',
            !isTextLeft && 'md:flex-row-reverse',
          )}
        >
          {/* Text side */}
          <div
            className={cn(
              'flex-1 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out',
              isVisible
                ? 'opacity-100 translate-x-0'
                : cn(
                    'motion-safe:opacity-0',
                    isTextLeft
                      ? 'motion-safe:-translate-x-5'
                      : 'motion-safe:translate-x-5',
                  ),
            )}
          >
            <span className="text-xs font-medium tracking-widest text-primary uppercase">
              {step.label}
            </span>
            <h3 className="mt-3 text-3xl font-bold text-foreground leading-tight md:text-5xl [text-wrap:balance]">
              {step.title}
            </h3>
            <p className="mt-4 max-w-md text-base text-muted-foreground leading-relaxed md:text-lg">
              {step.description}
            </p>
          </div>

          {/* Mock visual side */}
          <div
            className={cn(
              'flex flex-1 justify-center motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out motion-safe:delay-100',
              isVisible
                ? 'opacity-100 scale-100'
                : 'motion-safe:opacity-0 motion-safe:scale-95',
            )}
          >
            {MockComponent && <MockComponent className="w-full max-w-[280px] md:max-w-sm" />}
          </div>
        </div>
      </div>

      {/* Scroll-down chevron on first step */}
      {isFirst && showChevron && (
        <div
          className="absolute inset-x-0 bottom-8 flex justify-center motion-safe:animate-bounce"
          aria-hidden="true"
        >
          <ChevronDown className="h-6 w-6 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}

export function HowItWorksClient(): React.ReactElement {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState(1);
  const [showChevron, setShowChevron] = useState(true);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const refs = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    if (refs.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = refs.indexOf(entry.target as HTMLDivElement);
          if (index === -1) continue;
          const stepNum = index + 1;

          if (entry.isIntersecting) {
            setVisibleSteps((prev) => new Set(prev).add(stepNum));
            setActiveStep(stepNum);

            // Hide chevron once user scrolls past first step
            if (stepNum > 1) {
              setShowChevron(false);
            }
          }
        }
      },
      { threshold: 0.15 },
    );

    for (const ref of refs) {
      observer.observe(ref);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      {/* Step sections */}
      {HOW_IT_WORKS_STEPS.map((step, i) => (
        <div key={step.step} ref={(el) => { stepRefs.current[i] = el; }}>
          <StepSection
            step={step}
            isVisible={visibleSteps.has(step.step)}
            isFirst={i === 0}
            showChevron={showChevron}
          />
        </div>
      ))}

      {/* Step indicator (sticky dots) */}
      <div className="pointer-events-none absolute inset-y-0 right-3 z-10 flex items-center md:right-6">
        <div className="sticky top-1/2 flex -translate-y-1/2 flex-col gap-3" aria-hidden="true">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div
              key={step.step}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                activeStep === step.step
                  ? 'scale-125 bg-primary'
                  : 'bg-border',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
