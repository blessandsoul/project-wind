# How It Works — Cinematic Scroll-Snap Redesign

## Summary

Replace the current generic 3-column "How it works" grid with a cinematic, full-viewport section. Each of the 3 steps occupies `min-h-dvh` in the normal document flow, uses `scroll-snap-align: start` on a page-level snap context, and features stylized mock UI fragments alongside bold typography. Pure CSS scroll-snap + IntersectionObserver — no external dependencies.

## Goals

- Make the section feel premium and app-like (Linear, Stripe, Runway tier)
- Show users what the product experience looks like through abstract UI mockups
- Maintain mobile-first, accessible, palette-agnostic design
- Zero new dependencies — CSS scroll-snap + existing IntersectionObserver pattern

## Non-Goals

- No scroll hijacking or GSAP
- No Framer Motion or animation libraries
- No detailed/realistic product screenshots
- No placeholder images or fake data in mocks

---

## Architecture

### Component Structure

```
HowItWorks (Server Component — section wrapper with h2)
├── HowItWorksClient ('use client' — scroll observer + step indicator state)
│   ├── StepSection × 3 (each step, min-h-dvh, snap child)
│   │   ├── StepText (label, title, description — with entrance animation)
│   │   └── TemplateMock / ConfigureMock / GenerateMock (individual mock components)
│   └── StepIndicator (sticky dot nav showing active step)
```

- `HowItWorks` is a thin server component wrapper: renders the section `<section>` with an `h2` heading and the client component
- `HowItWorksClient` is the `'use client'` component that manages IntersectionObserver for animations and active step tracking
- Each `StepSection` is a `min-h-dvh` element with `scroll-snap-align: start` — lives in the normal document flow, no nested scroll container
- `StepIndicator` uses `position: sticky` within the section, not `position: fixed`
- Mock UI fragments are split into 3 separate components to stay under the 250-line component limit

### Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `features/landing/components/HowItWorks.tsx` | Rewrite | Server component wrapper with section heading |
| `features/landing/components/HowItWorksClient.tsx` | Create | Client component with scroll observer + animations + step indicator |
| `features/landing/components/mocks/TemplateMock.tsx` | Create | Step 1 abstract UI fragment — template grid |
| `features/landing/components/mocks/ConfigureMock.tsx` | Create | Step 2 abstract UI fragment — config panel |
| `features/landing/components/mocks/GenerateMock.tsx` | Create | Step 3 abstract UI fragment — result preview |
| `features/landing/constants/landing.constants.ts` | Modify | Update step data structure (remove iconName, add contentSide) |
| `app/(main)/page.tsx` | Modify | Remove `<ScrollReveal>` wrapper around `<HowItWorks />` (new component handles its own animations) |

No new dependencies.

---

## Layout

### Scroll Behavior — No Nested Scroll Container

Steps are **normal document flow elements** with `min-h-dvh`. No nested scroll container. Each step has `scroll-snap-align: start`. The snap context is set on the nearest scrollable ancestor (the page itself or a parent wrapper) using `scroll-snap-type: y proximity`.

**Why `proximity` instead of `mandatory`**: `mandatory` forces the viewport to always land on a snap point, which can feel like the UI is "fighting" the user on mobile when doing small flicks. `proximity` gives the cinematic snap feel when scrolling near a snap point but allows free scroll-through on fast swipes. This is the safer UX choice.

**Why no nested scroll container**: Nested scroll contexts (a `100dvh` container with `overflow-y: auto` containing `300dvh` of content) are unreliable across mobile browsers. iOS Safari and Android browsers handle the scroll handoff between nested and outer scroll poorly — momentum scrolling gets "trapped." By placing steps in the normal document flow, we avoid this entirely. The page scrolls naturally, steps snap into view, and sections before/after HowItWorks scroll normally.

### Desktop (md+)

Two-column split per step, alternating sides:

| Step | Text Side | Visual Side |
|------|-----------|-------------|
| 1 | Left | Right |
| 2 | Right | Left |
| 3 | Left | Right |

Content is vertically centered within each `min-h-dvh` section using flexbox. Max content width: `max-w-6xl` centered.

### Mobile

Single column, vertically centered. Text on top, mock visual below. Both elements stacked with `gap-8`. Mock visuals scale down but remain recognizable.

### Section Heading

The section `h2` ("How it works") appears **inside the first step's viewport**, above the Step 1 content. It is vertically positioned at the top of the first step section, creating a natural visual hierarchy. It is not repeated on subsequent steps. The `h2` has an `id` so the section `<section>` can use `aria-labelledby`.

### Step Indicator

Sticky vertical dot nav, positioned on the right edge **within the section**:

- Uses `position: sticky` with `top: 50%` — stays vertically centered as the user scrolls through the section, contained within the `<section>` bounds
- 3 dots, vertically stacked with `gap-3`
- Active: `bg-primary scale-125` with `transition-all duration-300`
- Inactive: `bg-border`
- Size: `w-2 h-2 rounded-full`
- Positioned: `sticky top-1/2 right-4 md:right-6 -translate-y-1/2`
- Naturally disappears when the section scrolls out of view (no observer needed for visibility)
- On mobile: `right-3` with slightly smaller dots

---

## Mock UI Fragments

All fragments use semantic tokens (`bg-card`, `border-border/50`, `bg-muted`, `bg-primary`, `rounded-xl`). No images, no hardcoded colors. Each mock is its own component file under `features/landing/components/mocks/` to stay within the 250-line limit.

### Step 1 — TemplateMock ("Pick a template")

A 2x2 grid of card outlines:

- Each card: `rounded-lg border border-border/50 bg-card`
- Inside each card: a rectangular area (`aspect-[4/3] bg-muted rounded`) simulating a thumbnail
- Below the thumbnail: a small bar (`h-3 w-2/3 bg-muted rounded-full`) simulating a label
- One card (e.g., top-right) has `ring-2 ring-primary` to indicate selection
- Overall container: `max-w-sm` on desktop, scales down on mobile

### Step 2 — ConfigureMock ("Configure your vision")

A vertical panel shape:

- Container: `rounded-xl border border-border/50 bg-card p-6`
- Top: 3 horizontal lines of varying width (`h-2.5 bg-muted rounded-full`, widths: `w-full`, `w-4/5`, `w-3/5`) with `space-y-2` — simulating a text prompt area
- Middle: 2 horizontal bars (`h-1.5 bg-muted rounded-full`) each with a small circle (`w-3 h-3 rounded-full bg-primary`) positioned along them — simulating sliders
- Bottom: a button shape (`h-9 w-28 bg-primary rounded-md`) centered
- Overall container: `max-w-xs`

### Step 3 — GenerateMock ("Generate and download")

A single large result card:

- Container: `rounded-xl border border-border/50 bg-card overflow-hidden`
- Main area: `aspect-[16/10] bg-muted` with a subtle `bg-primary/5` tinted overlay (flat, not gradient — avoids the visual identity rule against gradient backgrounds on cards)
- Top-left: thin progress bar, full width, `h-1 bg-primary rounded-full` (completed state)
- Bottom-right corner: a small icon button shape (`w-8 h-8 rounded-md bg-primary/10 border border-border/50`) with a down-arrow abstraction inside
- Overall container: `max-w-sm`

---

## Typography

Per step:

| Element | Classes |
|---------|---------|
| Section heading (h2) | `text-xl font-bold text-foreground md:text-2xl` — "How it works" (first step only) |
| Step label | `text-xs font-medium text-primary tracking-widest uppercase` — "STEP 01" |
| Title (h3) | `text-3xl md:text-5xl font-bold text-foreground leading-tight` with `text-wrap: balance` |
| Description | `text-base md:text-lg text-muted-foreground max-w-md leading-relaxed` |

Text group has `space-y-4` between elements.

---

## Animation

### Entrance Animations (IntersectionObserver)

Each step uses IntersectionObserver (`threshold: 0.15`, `root: null` — viewport is the root since steps are in normal document flow) to trigger entrance animations when scrolled into view:

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
- Scroll-snap behavior is also disabled (`scroll-snap-type: none`) — users with vestibular disorders should not have their scroll hijacked

### Scroll-Down Affordance

On the first step only, a subtle animated chevron (small `ChevronDown` icon from Lucide) appears at the bottom center. Uses `motion-safe:animate-bounce` (slow, subtle). Disappears once the user scrolls past the first step (controlled by the same IntersectionObserver). `aria-hidden="true"` since it's purely decorative.

---

## Dark Mode

No special handling needed. All elements use semantic tokens:
- `bg-card`, `bg-muted`, `border-border/50` adapt automatically
- `bg-primary/5`, `bg-primary/10`, `ring-primary` adapt per palette
- No shadows relied upon for depth — borders handle it
- Works across all 5 theme palettes without modification

---

## Accessibility

- Section uses `<section aria-labelledby="how-it-works-heading">` pointing to the `h2`
- Step sections use `role="group"` with `aria-label="Step 1: Pick a template"`
- Step indicator dots are decorative (`aria-hidden="true"`) — they don't provide navigation
- Mock UI fragments are decorative (`aria-hidden="true"`)
- Scroll-down chevron is decorative (`aria-hidden="true"`)
- All animations respect `prefers-reduced-motion`
- Scroll-snap disabled when `prefers-reduced-motion: reduce`
- Semantic heading hierarchy: section `h2` ("How it works"), step titles are `h3`
- Keyboard users can scroll normally — no scroll trapping

---

## Mobile Considerations

- `min-h-dvh` per step — uses `dvh` to account for mobile browser chrome
- Mock visuals scale down with `max-w-[280px]` on mobile
- Step indicator dots positioned `right-3` on mobile
- `scroll-snap-type: y proximity` allows free scrolling on fast swipes — no "trapped" feeling
- Steps are in normal document flow — no nested scroll context issues on iOS Safari
- All touch targets on step indicator are decorative (no interaction needed)

---

## Data Structure Update

```typescript
// Updated in landing.constants.ts

export interface HowItWorksStep {
  step: number;
  label: string;           // "STEP 01"
  title: string;
  description: string;
  contentSide: 'left' | 'right';  // Which side the text appears on (desktop)
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    label: 'STEP 01',
    title: 'Pick a template',
    description: 'Browse our curated library of AI templates for portraits, landscapes, product shots, and more.',
    contentSide: 'left',
  },
  {
    step: 2,
    label: 'STEP 02',
    title: 'Configure your vision',
    description: 'Write a prompt, adjust style parameters, and choose your output format. Full creative control.',
    contentSide: 'right',
  },
  {
    step: 3,
    label: 'STEP 03',
    title: 'Generate and download',
    description: 'AI creates your content in seconds. Download in high resolution, ready for social media or print.',
    contentSide: 'left',
  },
];
```

The `iconName` field is removed — mock UI fragments are determined by step number, not icon mapping. The `textAlign` field is renamed to `contentSide` to avoid confusion with CSS `text-align`.
