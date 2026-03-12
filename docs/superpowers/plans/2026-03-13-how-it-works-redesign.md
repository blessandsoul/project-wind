# How It Works — Cinematic Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic 3-column "How it works" grid with a cinematic, full-viewport scroll-snap section featuring alternating text/mock-UI layouts with entrance animations.

**Architecture:** Each of 3 steps is a `min-h-dvh` section in normal document flow with `scroll-snap-align: start`. A single `'use client'` component manages IntersectionObserver for entrance animations and active step tracking. Mock UI fragments are separate server-renderable components.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, CSS scroll-snap, IntersectionObserver API, Lucide React (ChevronDown icon only)

**Spec:** `docs/superpowers/specs/2026-03-13-how-it-works-redesign.md`

---

## Chunk 1: Data Layer + Mock UI Components

### Task 1: Update constants and types

**Files:**
- Modify: `client/src/features/landing/constants/landing.constants.ts:20-51`

- [ ] **Step 1: Update the HowItWorksStep interface and data**

Replace lines 20-51 in `landing.constants.ts` with:

```typescript
// ─── How It Works ────────────────────────────────────────────

export interface HowItWorksStep {
  step: number;
  label: string;
  title: string;
  description: string;
  contentSide: 'left' | 'right';
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    label: 'STEP 01',
    title: 'Pick a template',
    description:
      'Browse our curated library of AI templates for portraits, landscapes, product shots, and more.',
    contentSide: 'left',
  },
  {
    step: 2,
    label: 'STEP 02',
    title: 'Configure your vision',
    description:
      'Write a prompt, adjust style parameters, and choose your output format. Full creative control.',
    contentSide: 'right',
  },
  {
    step: 3,
    label: 'STEP 03',
    title: 'Generate and download',
    description:
      'AI creates your content in seconds. Download in high resolution, ready for social media or print.',
    contentSide: 'left',
  },
];
```

- [ ] **Step 2: Verify no other files import `iconName` from HowItWorksStep**

Run: `grep -r "iconName" client/src/features/landing/ --include="*.ts" --include="*.tsx"`

Only `HowItWorks.tsx` should reference it (which we'll rewrite in Task 5). If others reference it, note them for updating.

- [ ] **Step 3: Commit**

```bash
git add client/src/features/landing/constants/landing.constants.ts
git commit -m "refactor: update HowItWorksStep type with contentSide and labels"
```

---

### Task 2: Create TemplateMock component

**Files:**
- Create: `client/src/features/landing/components/mocks/TemplateMock.tsx`

- [ ] **Step 1: Create the mocks directory**

```bash
mkdir -p client/src/features/landing/components/mocks
```

- [ ] **Step 2: Write the TemplateMock component**

Create `client/src/features/landing/components/mocks/TemplateMock.tsx`:

```tsx
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
            'rounded-lg border border-border/50 bg-card p-2.5 transition-all duration-300',
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
```

- [ ] **Step 3: Commit**

```bash
git add client/src/features/landing/components/mocks/TemplateMock.tsx
git commit -m "feat: add TemplateMock component for how-it-works step 1"
```

---

### Task 3: Create ConfigureMock component

**Files:**
- Create: `client/src/features/landing/components/mocks/ConfigureMock.tsx`

- [ ] **Step 1: Write the ConfigureMock component**

Create `client/src/features/landing/components/mocks/ConfigureMock.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/features/landing/components/mocks/ConfigureMock.tsx
git commit -m "feat: add ConfigureMock component for how-it-works step 2"
```

---

### Task 4: Create GenerateMock component

**Files:**
- Create: `client/src/features/landing/components/mocks/GenerateMock.tsx`

- [ ] **Step 1: Write the GenerateMock component**

Create `client/src/features/landing/components/mocks/GenerateMock.tsx`:

```tsx
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
          <div className="h-3 w-3 border-b-2 border-r-2 border-primary rotate-45 -translate-y-0.5" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/features/landing/components/mocks/GenerateMock.tsx
git commit -m "feat: add GenerateMock component for how-it-works step 3"
```

---

## Chunk 2: Client Component + Scroll Snap CSS

### Task 5: Create HowItWorksClient component

**Files:**
- Create: `client/src/features/landing/components/HowItWorksClient.tsx`

This is the main `'use client'` component. It manages:
- IntersectionObserver for entrance animations on each step
- Active step tracking for the dot indicator
- Step indicator rendering (sticky dots)
- Scroll-down chevron on first step

- [ ] **Step 1: Write the HowItWorksClient component**

Create `client/src/features/landing/components/HowItWorksClient.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/features/landing/components/HowItWorksClient.tsx
git commit -m "feat: add HowItWorksClient with scroll observer and step indicator"
```

---

### Task 6: Rewrite HowItWorks server component wrapper

**Files:**
- Modify: `client/src/features/landing/components/HowItWorks.tsx`

- [ ] **Step 1: Rewrite HowItWorks.tsx as a thin server component**

Replace the entire contents of `client/src/features/landing/components/HowItWorks.tsx`:

```tsx
import type React from 'react';

import { HowItWorksClient } from './HowItWorksClient';

export function HowItWorks(): React.ReactElement {
  return (
    <section aria-labelledby="how-it-works-heading" className="how-it-works-section">
      <HowItWorksClient />
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/features/landing/components/HowItWorks.tsx
git commit -m "refactor: simplify HowItWorks to thin server component wrapper"
```

---

### Task 7: Add scroll-snap CSS and update page.tsx

**Files:**
- Modify: `client/src/app/globals.css`
- Modify: `client/src/app/(main)/page.tsx`

- [ ] **Step 1: Add scroll-snap utility to globals.css**

Append after the existing hero animations (after line 99) in `globals.css`:

```css
/* ── How It Works scroll-snap ── */

html:has(.how-it-works-section) {
  scroll-snap-type: y proximity;
}

@media (prefers-reduced-motion: reduce) {
  html:has(.how-it-works-section) {
    scroll-snap-type: none;
  }
}
```

The `:has()` selector scopes scroll-snap to pages containing the how-it-works section. Since `<html>` is the scrollable ancestor and steps use Tailwind's `snap-start`, the snap behavior activates only near step boundaries. Other page sections don't have `snap-start` so they scroll normally.

The `how-it-works-section` class must be added to the `<section>` in `HowItWorks.tsx`.

- [ ] **Step 2: Remove ScrollReveal wrapper from HowItWorks in page.tsx**

In `client/src/app/(main)/page.tsx`, change:

```tsx
      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>
```

to:

```tsx
      <HowItWorks />
```

The HowItWorksClient now handles its own entrance animations — the ScrollReveal wrapper would conflict.

- [ ] **Step 3: Commit**

```bash
git add client/src/app/globals.css client/src/app/(main)/page.tsx
git commit -m "feat: add scroll-snap CSS and remove ScrollReveal from HowItWorks"
```

---

### Task 8: Visual verification

- [ ] **Step 1: Start the dev server and verify**

```bash
cd client && npm run dev
```

Open `http://localhost:3000` in Chrome DevTools:

1. **Desktop (1280px+)**: Verify 3 full-viewport steps with alternating text/visual layout. Step 1 has heading + text left / template mock right. Step 2 reverses. Step 3 matches step 1 layout.
2. **Mobile (375px)**: Verify single-column stacked layout. Text on top, mock below. Scroll-down chevron visible on first step.
3. **Scroll behavior**: Verify snap-to-step works with `proximity` (snaps when near, free-scrolls when fast).
4. **Entrance animations**: Each step's text/visual should fade in when scrolled into view.
5. **Step indicator**: 3 dots on the right edge. Active dot is primary-colored and slightly larger.
6. **Dark mode**: Toggle — verify all tokens adapt correctly.
7. **Palette switch**: Cycle through all 5 palettes via ThemeSwitcher — verify mock elements use semantic tokens correctly.
8. **Reduced motion**: In DevTools > Rendering > Emulate CSS media feature `prefers-reduced-motion: reduce` — verify no animations, snap disabled.

- [ ] **Step 2: Fix any visual issues found**

If layout, spacing, or animations need adjustment, fix them now.

- [ ] **Step 3: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: visual adjustments for how-it-works section"
```
