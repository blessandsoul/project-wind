/**
 * Landing page static data — all copy and content in one place.
 * Change copy here, not in components.
 */

// ─── Trust Bar ───────────────────────────────────────────────

export interface TrustMetric {
  value: string;
  label: string;
}

export const TRUST_METRICS: TrustMetric[] = [
  { value: '12,000+', label: 'Active creators' },
  { value: '2.4M+', label: 'Images generated' },
  { value: '50+', label: 'AI templates' },
  { value: '4.9/5', label: 'Average rating' },
];

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

// ─── Template Showcase ───────────────────────────────────────

export interface ImageTemplateItem {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface VideoTemplateItem {
  id: string;
  title: string;
  description: string;
  posterImage: string;
  videoUrl: string;
}

export const IMAGE_TEMPLATES: ImageTemplateItem[] = [
  {
    id: 'img-1',
    title: 'Portrait Enhancement',
    description: 'Professional lighting, skin tone correction, and background refinement.',
    image: '/test-imgs/image-1.jpg',
  },
  {
    id: 'img-2',
    title: 'Product Photography',
    description: 'Studio-quality product shots from a simple description.',
    image: '/test-imgs/image-5.jpg',
  },
  {
    id: 'img-3',
    title: 'Cinematic Landscapes',
    description: 'Breathtaking landscapes with realistic depth and atmosphere.',
    image: '/test-imgs/image-9.jpg',
  },
  {
    id: 'img-4',
    title: 'Brand Identity',
    description: 'Logos, color palettes, and visual assets from a single prompt.',
    image: '/test-imgs/image-15.jpg',
  },
  {
    id: 'img-5',
    title: 'Architecture Visualization',
    description: 'Photorealistic renders of buildings and interiors from sketches.',
    image: '/test-imgs/image-18.jpg',
  },
  {
    id: 'img-6',
    title: 'Abstract Art',
    description: 'Unique generative artwork from creative prompts and style presets.',
    image: '/test-imgs/image-20.jpg',
  },
];

export const VIDEO_TEMPLATES: VideoTemplateItem[] = [
  {
    id: 'vid-1',
    title: 'Short-Form Social',
    description: 'Scroll-stopping clips for TikTok, Reels, and Shorts in seconds.',
    posterImage: '/test-imgs/image-12.jpg',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'vid-2',
    title: 'Product Showcase',
    description: 'Cinematic product reveal videos with dynamic camera movement.',
    posterImage: '/test-imgs/image-8.jpg',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  },
  {
    id: 'vid-3',
    title: 'Motion Graphics',
    description: 'Animated text, transitions, and visual effects from a single prompt.',
    posterImage: '/test-imgs/image-16.jpg',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
];

// ─── Prompt to Result ────────────────────────────────────────

export interface PromptResult {
  id: string;
  prompt: string;
  resultLabel: string;
  image: string;
}

export const PROMPT_RESULTS: PromptResult[] = [
  {
    id: '1',
    prompt: 'A minimalist product shot of wireless earbuds on a marble surface, soft studio lighting, clean white background',
    resultLabel: 'Generated in 6s',
    image: '/test-imgs/image-6.jpg',
  },
  {
    id: '2',
    prompt: 'Aerial view of a coastal city at golden hour, cinematic color grading, ultra-wide lens perspective',
    resultLabel: 'Generated in 8s',
    image: '/test-imgs/image-10.jpg',
  },
  {
    id: '3',
    prompt: 'Professional headshot of a woman in a modern office, natural window light, shallow depth of field, neutral tones',
    resultLabel: 'Generated in 5s',
    image: '/test-imgs/image-3.jpg',
  },
];

// ─── Testimonials ────────────────────────────────────────────

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Content Creator',
    quote: 'I replaced three different editing tools with this. The AI understands what I want before I finish typing the prompt.',
  },
  {
    id: '2',
    name: 'Marcus Rivera',
    role: 'E-commerce Manager',
    quote: 'Our product photography costs dropped by 80%. The quality is indistinguishable from a real studio shoot.',
  },
  {
    id: '3',
    name: 'Aisha Patel',
    role: 'Social Media Strategist',
    quote: 'I create a week of Instagram content in 20 minutes. The templates are incredibly well-designed.',
  },
  {
    id: '4',
    name: 'James Thornton',
    role: 'Freelance Designer',
    quote: 'The prompt-to-result quality is the best I have seen. My clients think I spent hours on each piece.',
  },
  {
    id: '5',
    name: 'Elena Volkov',
    role: 'Marketing Director',
    quote: 'We run campaigns across 12 markets. This tool generates localized visuals faster than our entire design team.',
  },
  {
    id: '6',
    name: 'David Kim',
    role: 'Startup Founder',
    quote: 'Saved us from hiring a full-time designer in year one. The credits model means we only pay for what we use.',
  },
  {
    id: '7',
    name: 'Olivia Santos',
    role: 'Real Estate Agent',
    quote: 'Virtual staging used to cost $200 per room. Now I do it myself in seconds with stunning results.',
  },
  {
    id: '8',
    name: 'Tom Nakamura',
    role: 'YouTuber',
    quote: 'Thumbnails that actually get clicks. The AI nails the style I need every single time.',
  },
];

// ─── FAQ ─────────────────────────────────────────────────────

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How do credits work?',
    answer:
      'Each generation costs a set number of credits depending on the template and output quality. You can purchase credit packs or subscribe for a monthly allowance. Unused credits roll over.',
  },
  {
    question: 'What formats can I generate?',
    answer:
      'We support JPEG, PNG, and WebP for images, and MP4 for video. You can choose resolution and aspect ratio before generating. All outputs are high-resolution and ready for commercial use.',
  },
  {
    question: 'How long does generation take?',
    answer:
      'Most images generate in 5-10 seconds. Video generation takes 30-60 seconds depending on length and complexity. You will see a real-time progress indicator.',
  },
  {
    question: 'Can I use generated content commercially?',
    answer:
      'Yes. All content you generate is yours to use for personal or commercial purposes. There are no additional licensing fees or usage restrictions.',
  },
  {
    question: 'What happens if I am not satisfied with a result?',
    answer:
      'You can regenerate with adjusted prompts or different parameters at no extra cost for the first retry. Our templates are designed to deliver consistent, high-quality results.',
  },
  {
    question: 'Is there an API for developers?',
    answer:
      'Yes. Our REST API lets you integrate AI generation directly into your apps and workflows. API access is available on all plans with per-request credit billing.',
  },
];
