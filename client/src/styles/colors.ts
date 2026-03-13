/**
 * Theme Palette Configuration — Source of Truth
 *
 * Each palette defines 5 colors and maps them to semantic UI roles.
 * The CSS in `themes.css` implements these mappings as CSS custom properties.
 *
 * To add a new palette:
 *   1. Add it here with colors + role mapping
 *   2. Add a matching `[data-theme="N"]` block in themes.css
 *   3. Add the palette number to ThemeSwitcher
 *
 * Role mapping guide:
 *   primary    → Main CTAs, active states, brand identity
 *   accent     → Highlights, badges, secondary emphasis
 *   destructive → Delete, errors, danger actions
 *   success    → Positive feedback, completed states
 *   warning    → Caution, pending states
 */

export interface PaletteColor {
  name: string;
  hex: string;
}

export interface PaletteConfig {
  id: number;
  name: string;
  colors: PaletteColor[];
  roles: {
    primary: string;
    accent: string;
    destructive: string;
    success: string;
    warning: string;
  };
}

export const PALETTES: PaletteConfig[] = [
  {
    id: 1,
    name: 'Coral Garden',
    colors: [
      { name: 'vibrant-coral', hex: '#ee6055' },
      { name: 'emerald', hex: '#60d394' },
      { name: 'light-green', hex: '#aaf683' },
      { name: 'jasmine', hex: '#ffd97d' },
      { name: 'sweet-salmon', hex: '#ff9b85' },
    ],
    roles: {
      primary: 'emerald',
      accent: 'jasmine',
      destructive: 'vibrant-coral',
      success: 'light-green',
      warning: 'sweet-salmon',
    },
  },
  {
    id: 2,
    name: 'Ocean Breeze',
    colors: [
      { name: 'vibrant-coral', hex: '#ee6352' },
      { name: 'emerald', hex: '#59cd90' },
      { name: 'fresh-sky', hex: '#3fa7d6' },
      { name: 'sunflower-gold', hex: '#fac05e' },
      { name: 'tangerine-dream', hex: '#f79d84' },
    ],
    roles: {
      primary: 'fresh-sky',
      accent: 'emerald',
      destructive: 'vibrant-coral',
      success: 'emerald',
      warning: 'sunflower-gold',
    },
  },
  {
    id: 3,
    name: 'Dusk Bloom',
    colors: [
      { name: 'pearl-beige', hex: '#fcecc9' },
      { name: 'cherry-blossom', hex: '#fcb0b3' },
      { name: 'strawberry-red', hex: '#f93943' },
      { name: 'sky-reflection', hex: '#7eb2dd' },
      { name: 'dusk-blue', hex: '#445e93' },
    ],
    roles: {
      primary: 'dusk-blue',
      accent: 'sky-reflection',
      destructive: 'strawberry-red',
      success: 'sky-reflection',
      warning: 'cherry-blossom',
    },
  },
  {
    id: 4,
    name: 'Neon Flora',
    colors: [
      { name: 'radioactive-grass', hex: '#7ddf64' },
      { name: 'lime-cream', hex: '#c0df85' },
      { name: 'tan', hex: '#deb986' },
      { name: 'bubblegum-pink', hex: '#db6c79' },
      { name: 'bubblegum-pink-2', hex: '#ed4d6e' },
    ],
    roles: {
      primary: 'radioactive-grass',
      accent: 'tan',
      destructive: 'bubblegum-pink-2',
      success: 'lime-cream',
      warning: 'bubblegum-pink',
    },
  },
  {
    id: 5,
    name: 'Royal Blaze',
    colors: [
      { name: 'indigo', hex: '#421196' },
      { name: 'purple-x11', hex: '#9529ff' },
      { name: 'school-bus-yellow', hex: '#ffc719' },
      { name: 'strawberry-red', hex: '#ff193b' },
      { name: 'mahogany-red', hex: '#b8001c' },
    ],
    roles: {
      primary: 'purple-x11',
      accent: 'school-bus-yellow',
      destructive: 'strawberry-red',
      success: 'purple-x11',
      warning: 'school-bus-yellow',
    },
  },
] as const;

export const DEFAULT_THEME = 1;

export const THEME_STORAGE_KEY = 'project-wind-theme';
