import type React from 'react';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { ROUTES } from '@/lib/constants/routes';

/**
 * Desktop (md+): 7 images in a Facetune-style collage
 *   Cols 1, 3, 5 = one tall image spanning both rows
 *   Cols 2, 4 = two shorter stacked images
 *
 * Mobile: first 6 images in a 3×2 grid (DO NOT TOUCH)
 */
const HERO_IMAGES = [
  { src: '/test-imgs/image-1.jpg', alt: 'AI-generated portrait' },
  { src: '/test-imgs/image-9.jpg', alt: 'AI-generated landscape' },
  { src: '/test-imgs/image-7.jpg', alt: 'AI-generated creative work' },
  { src: '/test-imgs/image-20.jpg', alt: 'AI-generated abstract art' },
  { src: '/test-imgs/image-5.jpg', alt: 'AI-generated product shot' },
  { src: '/test-imgs/image-13.jpg', alt: 'AI-generated design' },
  { src: '/test-imgs/image-3.jpg', alt: 'AI-generated scene' },
] as const;

export function Hero(): React.ReactElement {
  return (
    <section className="hero-gradient overflow-hidden pt-8 md:pt-16 lg:pt-20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* ── Centered text block ── */}
        <div className="mx-auto text-center md:max-w-[36rem] lg:max-w-[40rem] motion-safe:animate-[hero-fade-up_0.6s_ease-out_both]">
          <h1 className="text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Enhance your look
            <br className="hidden md:inline" />
            {' '}instantly
          </h1>
        </div>

        <div className="mx-auto mt-5 max-w-sm text-center md:mt-7 md:max-w-lg motion-safe:animate-[hero-fade-up_0.6s_ease-out_0.1s_both]">
          <p className="text-base leading-relaxed italic text-muted-foreground md:text-lg">
            Pick a template, describe your vision, and generate
            <br className="hidden md:inline" />
            {' '}professional visuals in one tap.
          </p>
          <p className="mt-1 text-base leading-relaxed italic text-muted-foreground md:text-lg">
            Look like the best version of your brand.
          </p>
        </div>

        <div className="mt-6 flex justify-center md:mt-8 motion-safe:animate-[hero-fade-up_0.6s_ease-out_0.2s_both]">
          <Link
            href={ROUTES.REGISTER}
            className="hero-cta group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-all duration-200 active:scale-[0.97] md:min-h-14 md:gap-3 md:px-10 md:py-5 md:text-lg md:hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Start creating
            <ArrowRight className="size-4 transition-transform duration-200 group-active:translate-x-0.5 md:size-5 md:group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ── Spacer ── */}
        <div className="h-8 md:h-16 lg:h-20" />

        {/* ── Image collage ── */}
        <div className="motion-safe:animate-[hero-fade-up_0.8s_ease-out_0.3s_both]">
          {/* Mobile: Facetune-style 3-col grid —
               center column spans full height, sides have 2 stacked squares */}
          <div
            className="aspect-[3/2] grid gap-1.5 md:hidden"
            style={{
              gridTemplateColumns: '1fr 1.15fr 1fr',
              gridTemplateRows: '1fr 1fr',
            }}
          >
            {/* Left top */}
            <div className="relative min-h-0 overflow-hidden rounded-2xl">
              <Image src={HERO_IMAGES[0].src} alt={HERO_IMAGES[0].alt} fill sizes="30vw" className="object-cover" priority />
            </div>
            {/* Center — spans both rows */}
            <div className="relative row-span-2 min-h-0 overflow-hidden rounded-2xl">
              <Image src={HERO_IMAGES[1].src} alt={HERO_IMAGES[1].alt} fill sizes="36vw" className="object-cover" priority />
            </div>
            {/* Right top */}
            <div className="relative min-h-0 overflow-hidden rounded-2xl">
              <Image src={HERO_IMAGES[2].src} alt={HERO_IMAGES[2].alt} fill sizes="30vw" className="object-cover" />
            </div>
            {/* Left bottom */}
            <div className="relative min-h-0 overflow-hidden rounded-2xl">
              <Image src={HERO_IMAGES[3].src} alt={HERO_IMAGES[3].alt} fill sizes="30vw" className="object-cover" />
            </div>
            {/* Right bottom */}
            <div className="relative min-h-0 overflow-hidden rounded-2xl">
              <Image src={HERO_IMAGES[4].src} alt={HERO_IMAGES[4].alt} fill sizes="30vw" className="object-cover" />
            </div>
          </div>

          {/* Desktop: Facetune-style collage
              Cols 1,3,5 = tall single image (row-span-2)
              Cols 2,4 = two shorter stacked images
              Grid auto-flow places items correctly:
              [0:tall] [1:short] [2:tall] [3:short] [4:tall]
                       [5:short]          [6:short]          */}
          <div
            className="hidden md:grid gap-2.5 lg:gap-3"
            style={{
              gridTemplateColumns: '1fr 0.85fr 1.1fr 0.85fr 1fr',
              gridTemplateRows: '1fr 1fr',
            }}
          >
            {/* Col 1 — tall (spans 2 rows) */}
            <div className="relative row-span-2 overflow-hidden rounded-2xl">
              <Image
                src={HERO_IMAGES[0].src}
                alt={HERO_IMAGES[0].alt}
                fill
                sizes="22vw"
                className="object-cover"
                priority
              />
            </div>

            {/* Col 2 — top */}
            <div className="relative aspect-[6/5] overflow-hidden rounded-2xl">
              <Image
                src={HERO_IMAGES[1].src}
                alt={HERO_IMAGES[1].alt}
                fill
                sizes="18vw"
                className="object-cover"
              />
            </div>

            {/* Col 3 — tall center (spans 2 rows) */}
            <div className="relative row-span-2 overflow-hidden rounded-2xl">
              <Image
                src={HERO_IMAGES[2].src}
                alt={HERO_IMAGES[2].alt}
                fill
                sizes="24vw"
                className="object-cover"
                priority
              />
            </div>

            {/* Col 4 — top */}
            <div className="relative aspect-[6/5] overflow-hidden rounded-2xl">
              <Image
                src={HERO_IMAGES[3].src}
                alt={HERO_IMAGES[3].alt}
                fill
                sizes="18vw"
                className="object-cover"
              />
            </div>

            {/* Col 5 — tall (spans 2 rows) */}
            <div className="relative row-span-2 overflow-hidden rounded-2xl">
              <Image
                src={HERO_IMAGES[4].src}
                alt={HERO_IMAGES[4].alt}
                fill
                sizes="22vw"
                className="object-cover"
              />
            </div>

            {/* Col 2 — bottom */}
            <div className="relative aspect-[6/5] overflow-hidden rounded-2xl">
              <Image
                src={HERO_IMAGES[5].src}
                alt={HERO_IMAGES[5].alt}
                fill
                sizes="18vw"
                className="object-cover"
              />
            </div>

            {/* Col 4 — bottom */}
            <div className="relative aspect-[6/5] overflow-hidden rounded-2xl">
              <Image
                src={HERO_IMAGES[6].src}
                alt={HERO_IMAGES[6].alt}
                fill
                sizes="18vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
