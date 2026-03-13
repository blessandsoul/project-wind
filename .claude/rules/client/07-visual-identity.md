> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# Visual Identity: "Dark Studio + Clean SaaS"

This project is an **AI content generation platform**. The visual identity must communicate: powerful creative tool, premium quality, trustworthy enough to spend credits on. Every screen should feel like a product people pay for — not a template demo.

**Reference products**: GitHub (dark mode), Figma, Framer, Runway, Linear.

---

## Core Aesthetic Principles

### 1. Dark Mode Is the Default

Dark mode is the **primary experience** — it's where users generate and view AI content. Images and videos pop against dark backgrounds. Light mode exists as an alternative, not the default.

- Default theme: `dark` on `<html>`.
- Design dark mode first, then adapt for light.
- Generated content (images, videos) should feel like they're floating on the dark canvas — no heavy borders around media.

### 2. 90% Monochrome, 10% Color

The UI is overwhelmingly neutral. Color is reserved for **meaning** — actions, status, emphasis. When color appears, it should feel intentional, not decorative.

- Backgrounds, text, borders, dividers: all from `background`, `foreground`, `muted`, `border` tokens.
- Primary color: CTAs, active nav, selected states, progress indicators.
- Accent color: badges, highlights, secondary emphasis.
- Semantic colors (destructive, success, warning): only where they communicate status.
- Never use color for decoration. If removing the color wouldn't lose information, remove it.

### 3. Depth Through Subtlety

Depth comes from **layering**, not heavy shadows or gradients. Think glass panes stacked, not paper thrown on a table.

- Cards sit on `bg-card` with `border border-border/50` — the border is the depth cue, not a shadow.
- Elevated elements (modals, popovers, dropdowns): `shadow-lg` in light mode, `border border-border/50` in dark mode (shadows are nearly invisible on dark backgrounds — rely on borders).
- Use `bg-primary/5` and `bg-primary/10` tinted backgrounds for selected/active states instead of changing text color.
- Glassmorphism (`backdrop-blur`) only on: sticky headers, floating toolbars, modal backdrops. Never on content cards.

### 4. Content Is the Interface

On a content generation platform, the **generated content is the star**. UI chrome should recede.

- Galleries, previews, and generation results: full-bleed or near full-bleed. No unnecessary padding or frames around media.
- Use `aspect-ratio` on all media containers to prevent CLS.
- Dark backgrounds behind generated images — never place AI-generated visuals on white cards in dark mode.
- Image thumbnails: `rounded-lg` or `rounded-xl`, subtle `ring-1 ring-border/30` if needed for definition.

---

## Theme System

This project uses a **5-palette theme system** with runtime switching via `data-theme` attribute on `<html>`. See `src/styles/colors.ts` for palette definitions and `src/styles/themes.css` for CSS implementation.

### How It Works

- Each palette defines 5 colors mapped to semantic roles (primary, accent, destructive, success, warning).
- Switching palette: set `data-theme="1"` through `"5"` on `<html>`.
- `ThemeSwitcher` component (bottom-left corner) handles switching + localStorage persistence.
- All 5 palettes have both light (`:root`) and dark (`.dark`) mode variants.
- **Never hardcode palette colors.** Always use semantic tokens (`bg-primary`, `text-destructive`). The palette system handles the rest.

### Palette Reference

| # | Name | Primary | Accent | Destructive | Personality |
|---|------|---------|--------|-------------|-------------|
| 1 | Coral Garden | Emerald | Jasmine | Coral | Warm, organic, garden-fresh |
| 2 | Ocean Breeze | Fresh Sky | Emerald | Coral | Cool, trustworthy, balanced |
| 3 | Dusk Bloom | Dusk Blue | Sky Reflection | Strawberry | Elegant, editorial, composed |
| 4 | Neon Flora | Radioactive Grass | Tan | Bubblegum Pink | Bold, energetic, punchy |
| 5 | Royal Blaze | Purple X11 | School Bus Yellow | Strawberry Red | Intense, regal, high-contrast |

### Rules

1. **Every component must look good across all 5 palettes.** If it only looks right with one color, the design depends too much on the specific hue.
2. **Test every new page/component** by cycling through palettes 1-5. If it breaks visually on any palette, fix it.
3. **Never reference palette colors by name** in components (no "emerald", no "coral"). Use semantic tokens.
4. **Primary color backgrounds** (`bg-primary`) should always pair with `text-primary-foreground`. Each palette's foreground is tuned for contrast.

---

## Page-Level Visual Patterns

### Landing Page (Unauthenticated)

The landing page is the sales pitch. It should feel **cinematic and premium** — more marketing site than web app.

- **Hero section**: Large, bold headline. Generous whitespace. Single primary CTA. Optional secondary ghost/outline button. Background can use subtle gradient or `bg-primary/5` tint.
- **Showcase section**: Full-width or near-full-width grid of generated content samples. Let the AI output sell the product. Dark background to make images pop.
- **How it works**: 3-step horizontal flow on desktop, vertical stack on mobile. Use numbered steps or icons. Keep it tight — this section should be scannable in 5 seconds.
- **Feature highlights**: Cards with icon + title + one-sentence description. Max 3-4 features visible at once. No walls of text.
- **Social proof**: If available — metrics, testimonials, logos. Keep it understated.
- **Final CTA**: Repeat the main call-to-action before the footer. Same style as hero CTA.
- **Footer**: Minimal. Links, legal, socials. `bg-muted/50` or subtle separation from content.

**Landing page anti-patterns:**
- No stock photos. Use actual generated content or abstract visuals.
- No feature laundry lists. 3-4 key benefits, not 12 bullet points.
- No "Welcome to our platform" copy. Lead with the value: what can the user create?

### Dashboard (Authenticated)

Clean, functional, information-dense. This is the workspace — not a marketing page.

- **Top section**: User's credit balance (prominent), quick-action buttons (New Generation, Browse Templates).
- **Recent generations**: Grid of thumbnails. Each shows status (processing/completed/failed), creation date, template used.
- **Stats/activity**: Lightweight — generations this month, credits used. Don't overdo the dashboard widgets.
- **Empty states**: Friendly, actionable. "No generations yet — start creating" with a CTA to templates.

### Generation Workspace

Where users configure and create content. This is the **core product experience**.

- **Template selection**: Visual grid. Template thumbnails should be large enough to see what they produce.
- **Configuration panel**: Form inputs for prompts, settings. Keep it focused — one column, logical grouping.
- **Preview/result area**: Full-width or split-screen on desktop. The generated result gets the most space.
- **Processing state**: Skeleton loader matching the expected output dimensions. Progress indicator if available. Never a blank screen while generating.

### Admin Panel

Functional over beautiful. Admins need to get things done quickly.

- **Data tables**: Full-width, compact rows, sortable columns. Use `text-sm` for table content.
- **Forms**: Standard widths (`max-w-lg` or `max-w-xl`), clear labels, obvious save/cancel actions.
- **No fancy animations** in admin. Transitions should be instant or near-instant.

---

## Component-Level Visual Patterns

### Buttons

- **Primary**: `bg-primary text-primary-foreground`. Used for main actions only (1 per section).
- **Secondary/Ghost**: `bg-secondary text-secondary-foreground` or `variant="outline"`. For all other actions.
- **Destructive**: `bg-destructive text-white`. Only for delete/danger actions. Always behind a confirmation dialog.
- **Icon buttons**: Use `variant="ghost"` with `size="icon"`. Always include `aria-label`.
- **Button sizing**: Default `h-10` for standard. `h-9` for compact/table contexts. `h-11` or `h-12` for hero CTAs.

### Cards

- **Default**: `bg-card border border-border/50 rounded-xl` — no shadow in dark mode, `shadow-sm` in light mode.
- **Interactive cards** (clickable): Add `transition-all duration-200 active:scale-[0.98] cursor-pointer`. On desktop add `md:hover:border-primary/30`.
- **Content cards** (media): Minimize chrome. Image fills most of the card. Small text overlay or bottom strip for metadata.
- **Stat cards**: Number is the hero element — large `text-2xl font-bold`. Label is `text-sm text-muted-foreground` below.

### Navigation

- **Top nav (desktop)**: Clean horizontal bar. Logo left, nav links center or right, user menu far right. `bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0`.
- **Bottom nav (mobile)**: 4-5 icon tabs. Active tab uses `text-primary`. Inactive uses `text-muted-foreground`.
- **Sidebar (dashboard/admin)**: `bg-sidebar` with `border-r border-sidebar-border`. Collapsible on mobile. Active item: `bg-sidebar-accent text-sidebar-accent-foreground`.

### Forms

- **Input fields**: `bg-transparent border border-input rounded-md`. On focus: `ring-2 ring-ring/50`. No custom input backgrounds — keep them neutral.
- **Labels**: `text-sm font-medium text-foreground`. Above the input, not inside it.
- **Error states**: `border-destructive` on input + `text-sm text-destructive` message below.
- **Form sections**: Group related fields with a heading (`text-lg font-semibold`) and consistent `space-y-4` between fields.

### Modals & Sheets

- **Desktop modals**: Centered, `max-w-lg`, with glassmorphism backdrop (`bg-background/80 backdrop-blur-sm`).
- **Mobile sheets**: Bottom sheet (Drawer). Swipe-down to dismiss. Primary action in thumb zone.
- **Confirmation dialogs**: Clear destructive action title, explanation, two buttons (Cancel + Confirm). Destructive confirm uses `bg-destructive`.

---

## Visual Effects — Use Sparingly

### Allowed

- `bg-primary/5` or `bg-primary/10` tinted backgrounds for active/selected states.
- `ring-1 ring-primary/30` for focus or selected borders.
- Subtle `border-primary/20` on hover for interactive cards.
- `backdrop-blur-sm` on sticky headers and modal backdrops only.
- Skeleton loaders using `bg-muted animate-pulse rounded` — match the shape of content they replace.

### Forbidden

- Gradient backgrounds on cards or sections (except landing page hero, used sparingly).
- Glow effects (`box-shadow` with color spread) — they look cheap and age poorly.
- Animated gradient borders — too flashy for a professional tool.
- Parallax scrolling — performance killer on mobile, adds no value.
- Text gradients — unless it's a single hero headline on the landing page.
- Decorative SVG shapes, floating blobs, or abstract backgrounds — they scream "template".

---

## Iconography

- **Icon library**: Lucide React (comes with shadcn/ui). Consistent, clean, 24px grid.
- **Icon size**: `16px` (inline/compact), `20px` (standard), `24px` (prominent/nav).
- **Icon color**: `text-muted-foreground` by default. `text-primary` for active states. `text-foreground` for high-emphasis.
- **Never use emoji as icons** in the app UI. Emoji is for toast messages at most.
- **No icon soup**: If a section has more than 5 different icons visible at once, reduce it.

---

## Content Tone (UI Copy)

The visual identity extends to how the product speaks.

- **Confident, not excited**: "Generate your image" not "Let's create something amazing!"
- **Concise**: Button labels are 2-3 words max. Descriptions are 1 sentence.
- **No filler words**: Cut "just", "simply", "easily", "please".
- **Active voice**: "Select a template" not "A template can be selected".
- **Technical where needed**: Users understand "credits", "prompts", "resolution". Don't dumb it down.

---

## Quality Checklist

Before considering any page/component done:

- [ ] Looks correct in dark mode (primary experience)?
- [ ] Looks correct in light mode?
- [ ] Tested across all 5 palettes (cycle through ThemeSwitcher)?
- [ ] Generated content / media has visual prominence — not buried in UI chrome?
- [ ] Color is used semantically, not decoratively?
- [ ] No hardcoded colors — all from semantic tokens?
- [ ] Cards use borders for depth in dark mode (not shadows)?
- [ ] Interactive elements have visible active/focus states?
- [ ] Empty states are actionable (not just "No data")?
- [ ] Animations are in `motion-safe:` variant?
