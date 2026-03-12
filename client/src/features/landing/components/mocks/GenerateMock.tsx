import type React from 'react';

import { cn } from '@/lib/utils';

export function GenerateMock({ className }: { className?: string }): React.ReactElement {
  return (
    <div
      className={cn('max-w-sm overflow-hidden rounded-xl border border-border/50 bg-card', className)}
      aria-hidden="true"
    >
      {/* Progress bar (completed) */}
      <div className="px-3 pt-3">
        <div className="h-1 w-full rounded-full bg-primary" />
      </div>

      {/* Result area */}
      <div className="relative m-3 mt-2">
        <div className="relative aspect-[16/10] rounded-lg bg-muted">
          <div className="absolute inset-0 rounded-lg bg-primary/5" />
        </div>

        {/* Download button */}
        <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md border border-border/50 bg-primary/10">
          {/* Down arrow abstraction */}
          <div className="h-2.5 w-2.5 border-b-2 border-r-2 border-primary rotate-45 translate-y-[-3px]" />
        </div>
      </div>
    </div>
  );
}
