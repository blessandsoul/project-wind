import type React from 'react';

import { cn } from '@/lib/utils';

export function ConfigureMock({ className }: { className?: string }): React.ReactElement {
  return (
    <div
      className={cn('max-w-xs rounded-xl border border-border/50 bg-card p-6', className)}
      aria-hidden="true"
    >
      {/* Prompt area */}
      <div className="space-y-2">
        <div className="h-2.5 w-full rounded-full bg-muted" />
        <div className="h-2.5 w-4/5 rounded-full bg-muted" />
        <div className="h-2.5 w-3/5 rounded-full bg-muted" />
      </div>

      {/* Sliders */}
      <div className="mt-6 space-y-4">
        {[0.6, 0.4].map((position, i) => (
          <div key={i} className="relative">
            <div className="h-1.5 w-full rounded-full bg-muted" />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary"
              style={{ left: `${position * 100}%` }}
            />
          </div>
        ))}
      </div>

      {/* Generate button */}
      <div className="mt-6 flex justify-center">
        <div className="h-9 w-28 rounded-md bg-primary" />
      </div>
    </div>
  );
}
