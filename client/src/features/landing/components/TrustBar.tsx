import type React from 'react';

import { TRUST_METRICS } from '../constants/landing.constants';

export function TrustBar(): React.ReactElement {
  return (
    <section className="border-y border-border/50 bg-muted/30 py-8 md:py-10">
      <div className="container mx-auto grid grid-cols-2 gap-6 px-4 md:grid-cols-4 md:gap-8">
        {TRUST_METRICS.map((metric) => (
          <div key={metric.label} className="text-center">
            <p className="text-2xl font-bold tabular-nums text-foreground md:text-3xl">
              {metric.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
