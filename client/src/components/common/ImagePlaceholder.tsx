import type React from 'react';
import type { LucideIcon } from 'lucide-react';

import { ImageOff } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  icon?: LucideIcon;
  label?: string;
  className?: string;
}

/**
 * Visual placeholder for missing/unavailable images.
 * Renders a themed surface with an icon, decorative dots pattern, and optional label.
 */
export function ImagePlaceholder({
  icon: Icon = ImageOff,
  label,
  className,
}: ImagePlaceholderProps): React.ReactElement {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-muted/60',
        className,
      )}
    >
      {/* Subtle dot grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Ambient glow behind icon */}
      <div
        aria-hidden="true"
        className="absolute h-24 w-24 rounded-full bg-primary/10 blur-2xl"
      />

      {/* Icon + label */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Icon className="h-5 w-5 text-primary/70" />
        </div>
        {label ? (
          <span className="text-xs font-medium text-muted-foreground/70">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
