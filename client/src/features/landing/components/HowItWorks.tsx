import type React from 'react';

import { HOW_IT_WORKS_STEPS } from '../constants/landing.constants';
import type { HowItWorksStep } from '../constants/landing.constants';

function StepCard({ step }: { step: HowItWorksStep }): React.ReactElement {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Step label */}
      <span className="text-xs font-medium text-primary tabular-nums">
        {step.label}
      </span>

      <h3 className="mt-2 text-lg font-semibold text-foreground">{step.title}</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
        {step.description}
      </p>
    </div>
  );
}

export function HowItWorks(): React.ReactElement {
  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three steps to your next masterpiece
          </p>
        </div>

        {/* Steps */}
        <div className="relative mx-auto grid max-w-3xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {/* Connecting line (desktop only) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-7 right-[calc(16.67%+1rem)] left-[calc(16.67%+1rem)] hidden border-t border-dashed border-border/60 md:block"
          />

          {HOW_IT_WORKS_STEPS.map((step) => (
            <StepCard key={step.step} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}
