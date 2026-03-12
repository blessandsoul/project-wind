# How It Works — Cinematic Scroll-Snap Redesign

## Summary

Replace the current generic 3-column "How it works" grid with a cinematic, full-viewport scroll-snap section. Each of the 3 steps occupies `100dvh`, snaps into view on scroll, and features stylized mock UI fragments alongside bold typography. Pure CSS scroll-snap + IntersectionObserver — no external dependencies.

## Goals

- Make the section feel premium and app-like (Linear, Stripe, Runway tier)
- Show users what the product experience looks like through abstract UI mockups
- Maintain mobile-first, accessible, palette-agnostic design
- Zero new dependencies — CSS scroll-snap + existing ScrollReveal pattern

## Non-Goals

- No scroll hijacking or GSAP
- No Framer Motion or animation libraries
- No detailed/realistic product screenshots
- No placeholder images or fake data in mocks

---

## Architecture

### Component Structure

```
HowItWorks (Server Component — layout container)
├── HowItWorksClient ('use client' — scroll observer + step indicator state)
│   ├── StepSection × 3 (each step, 100dvh, snap child)
│   │   ├── StepText (label, title, description — with entrance animation)
│   │   └── StepMockUI (abstract UI fragment — with entrance animation)
│   └── StepIndicator (fixed dot nav showing active step)
```

- `HowItWorks` remains a thin server component wrapper for the section element
- `HowItWorksClient` is the `'use client'` component that manages IntersectionObserver for animations and active step tracking
- Each `StepSection` is a snap-align child
- `StepIndicator` is position-fixed within the section, shows 3 dots

### Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `features/landing/components/HowItWorks.tsx` | Rewrite | New cinematic layout |
| `features/landing/components/HowItWorksClient.tsx` | Create | Client component with scroll observer + animations |
| `features/landing/components/StepMockUI.tsx` | Create | Abstract UI fragment components for each step |
| `features/landing/constants/landing.constants.ts` | Modify | Update step data structure (remove iconName, add alignment) |

No new dependencies. No changes to page.tsx integration (component name stays the same).

---

## Layout

### Scroll Container

The `HowItWorksClient` component is the scroll-snap container:

```css
scroll-snap-type: y mandatory;
height: 100dvh;
overflow-y: auto;
```

Each `StepSection` child:

```css
scroll-snap-align: start;
height: 100dvh;
```

After the 3rd step, the snap container ends and normal page scroll resumes.

### Desktop (md+)

Two-column split per step, alternating sides:

| Step | Text Side | Visual Side |
|------|-----------|-------------|
| 1 | Left | Right |
| 2 | Right | Left |
| 3 | Left | Right |

Content is vertically centered within each `100dvh` section. Max content width: `max-w-6xl` centered.

### Mobile

Single column, vertically centered. Text on top, mock visual below. Both elements stacked with `gap-8`. Mock visuals scale down but remain recognizable.

### Step Indicator

Fixed vertical dot nav, positioned on the right edge of the scroll container:

- 3 dots, vertically stacked with `gap-3`
- Active: `bg-primary scale-125` with transition
- Inactive: `bg-border`
- Size: `w-2 h-2 rounded-full`
- Vertically centered on the right: `fixed right-6 top-1/2 -translate-y-1/2`
- Only visible while the how-it-works section is in view (controlled by observer)

---

## Mock UI Fragments

All fragments use semantic tokens (`bg-card`, `border-border/50`, `bg-muted`, `bg-primary`, `rounded-xl`). No images, no hardcoded colors.

### Step 1 — "Pick a template"

A 2x2 grid of card outlines:

- Each card: `rounded-lg border border-border/50 bg-card`
- Inside each card: a rectangular area (`aspect-[4/3] bg-muted rounded`) simulating a thumbnail
- Below the thumbnail: a small bar (`h-3 w-2/3 bg-muted rounded-full`) simulating a label
- One card (e.g., top-right) has `ring-2 ring-primary` to indicate selection
- Overall container: `max-w-sm` on desktop, scales down on mobile

### Step 2 — "Configure your vision"

A vertical panel shape:

- Container: `rounded-xl border border-border/50 bg-card p-6`
- Top: 3 horizontal lines of varying width (`h-2.5 bg-muted rounded-full`, widths: `w-full`, `w-4/5`, `w-3/5`) with `space-y-2` — simulating a text prompt area
- Middle: 2 horizontal bars (`h-1.5 bg-muted rounded-full`) each with a small circle (`w-3 h-3 rounded-full bg-primary`) positioned along them — simulating sliders
- Bottom: a button shape (`h-9 w-28 bg-primary rounded-md`) centered
- Overall container: `max-w-xs`

### Step 3 — "Generate and download"

A single large result card:

- Container: `rounded-xl border border-border/50 bg-card overflow-hidden`
- Main area: `aspect-[16/10] bg-muted` with a subtle diagonal gradient wash using `bg-gradient-to-br from-primary/5 via-transparent to-primary/10`
- Top-left: thin progress bar, full width, `h-1 bg-primary rounded-full` (completed state)
- Bottom-right corner: a small icon button shape (`w-8 h-8 rounded-md bg-primary/10 border border-border/50`) with a down-arrow abstraction inside
- Overall container: `max-w-sm`

---

## Typography

Per step:

| Element | Classes |
|---------|---------|
| Step label | `text-xs font-medium text-primary tracking-widest uppercase` — "STEP 01" |
| Title | `text-3xl md:text-5xl font-bold text-foreground leading-tight` with `text-wrap: balance` |
| Description | `text-base md:text-lg text-muted-foreground max-w-md leading-relaxed` |

Text group has `space-y-4` between elements.

---

## Animation

### Entrance Animations (IntersectionObserver)

Each step uses IntersectionObserver (`threshold: 0.3`) to trigger entrance animations when snapped into view:

**Text side:**
- Fades in: `opacity-0 → opacity-100`
- Slides from its alignment edge: left-aligned text slides from `translate-x-[-20px]`, right-aligned from `translate-x-[20px]`
- Duration: `600ms`, `ease-out`

**Mock visual:**
- Fades in: `opacity-0 → opacity-100`
- Scales up: `scale-95 → scale-100`
- Duration: `700ms`, `ease-out`
- Delay: `100ms` after text starts

**Step indicator:**
- Active dot transitions: `transition-all duration-300`
- Scale: `scale-100 → scale-125` on active
- Color: `bg-border → bg-primary` on active

### Reduced Motion

All animations wrapped in `motion-safe:` Tailwind variant. With `prefers-reduced-motion: reduce`:
- No transforms (no slide, no scale)
- No opacity transitions
- Content is immediately visible
- Step indicator still updates color (no scale)

---

## Dark Mode

No special handling needed. All elements use semantic tokens:
- `bg-card`, `bg-muted`, `border-border/50` adapt automatically
- `bg-primary/5`, `bg-primary/10`, `ring-primary` adapt per palette
- No shadows relied upon for depth — borders handle it
- Works across all 5 theme palettes without modification

---

## Accessibility

- Step sections use `role="group"` with `aria-label="Step 1: Pick a template"`
- Step indicator dots are decorative (`aria-hidden="true"`) — they don't provide navigation
- Mock UI fragments are decorative (`aria-hidden="true"`)
- All animations respect `prefers-reduced-motion`
- Semantic heading hierarchy maintained: section `h2`, step titles are `h3`
- Keyboard users can scroll normally through snap sections

---

## Mobile Considerations

- Full `100dvh` per step — uses `dvh` to account for mobile browser chrome
- Mock visuals scale down with `max-w-[280px]` on mobile
- Step indicator dots are smaller on mobile and positioned `right-3`
- Touch scrolling with snap still works naturally on iOS/Android
- All touch targets on step indicator are decorative (no interaction needed)

---

## Data Structure Update

```typescript
// Updated in landing.constants.ts

export interface HowItWorksStep {
  step: number;
  label: string;        // "STEP 01"
  title: string;
  description: string;
  textAlign: 'left' | 'right';  // Which side text appears on desktop
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    label: 'STEP 01',
    title: 'Pick a template',
    description: 'Browse our curated library of AI templates for portraits, landscapes, product shots, and more.',
    textAlign: 'left',
  },
  {
    step: 2,
    label: 'STEP 02',
    title: 'Configure your vision',
    description: 'Write a prompt, adjust style parameters, and choose your output format. Full creative control.',
    textAlign: 'right',
  },
  {
    step: 3,
    label: 'STEP 03',
    title: 'Generate and download',
    description: 'AI creates your content in seconds. Download in high resolution, ready for social media or print.',
    textAlign: 'left',
  },
];
```

The `iconName` field is removed — mock UI fragments are determined by step number, not icon mapping.
