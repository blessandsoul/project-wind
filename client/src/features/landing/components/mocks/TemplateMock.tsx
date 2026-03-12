import type React from 'react';

import { cn } from '@/lib/utils';

export function TemplateMock({ className }: { className?: string }): React.ReactElement {
  const cards = [
    { selected: false },
    { selected: true },
    { selected: false },
    { selected: false },
  ];

  return (
    <div className={cn('grid max-w-sm grid-cols-2 gap-3', className)} aria-hidden="true">
      {cards.map((card, i) => (
        <div
          key={i}
          className={cn(
            'rounded-lg border border-border/50 bg-card p-2.5',
            card.selected && 'ring-2 ring-primary',
          )}
        >
          <div className="aspect-[4/3] rounded bg-muted" />
          <div className="mt-2 h-3 w-2/3 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}
