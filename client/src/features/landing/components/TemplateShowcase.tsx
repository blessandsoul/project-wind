'use client';

import type React from 'react';

import Image from 'next/image';
import { useRef, useEffect } from 'react';
import { ImageIcon, Film } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

import { IMAGE_TEMPLATES, VIDEO_TEMPLATES } from '../constants/landing.constants';

export function TemplateShowcase(): React.ReactElement {
  return (
    <section className="bg-muted/20 py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section heading */}
        <div className="mb-12 text-center md:mb-16">
          <Badge variant="secondary" className="mb-3">
            Templates
          </Badge>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            Images and videos, one platform
          </h2>
          <p className="mt-3 text-muted-foreground">
            Generate professional visuals across every format
          </p>
        </div>

        {/* ── Image Templates ── */}
        <div className="mb-14 md:mb-20">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Image Generation</h3>
            <Badge variant="outline" className="text-xs">
              {IMAGE_TEMPLATES.length} templates
            </Badge>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {IMAGE_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className="min-w-[280px] snap-start overflow-hidden transition-all duration-200 active:scale-[0.98] md:min-w-0 md:hover:border-primary/30"
              >
                <div className="relative aspect-video">
                  <Image
                    src={template.image}
                    alt={template.title}
                    fill
                    sizes="(max-width: 768px) 280px, 33vw"
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground">{template.title}</h4>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {template.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Video Templates ── */}
        <div>
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Film className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Video Generation</h3>
            <Badge variant="outline" className="text-xs">
              {VIDEO_TEMPLATES.length} templates
            </Badge>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {VIDEO_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className="min-w-[280px] snap-start overflow-hidden transition-all duration-200 active:scale-[0.98] md:min-w-0 md:hover:border-primary/30"
              >
                <VideoPreview
                  videoUrl={template.videoUrl}
                  posterImage={template.posterImage}
                  title={template.title}
                />
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground">{template.title}</h4>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {template.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Autoplay video preview — plays muted when scrolled into view, pauses when out.
 * Always muted, no controls, no sound ever.
 */
function VideoPreview({
  videoUrl,
  posterImage,
  title,
}: {
  videoUrl: string;
  posterImage: string;
  title: string;
}): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay blocked by browser — poster image stays visible
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(video);
    return (): void => observer.disconnect();
  }, []);

  return (
    <div className="relative aspect-video overflow-hidden">
      {/* Poster image — visible until video loads and plays */}
      <Image
        src={posterImage}
        alt={title}
        fill
        sizes="(max-width: 768px) 280px, 33vw"
        className="object-cover"
      />

      <video
        ref={videoRef}
        src={videoUrl}
        muted
        loop
        playsInline
        preload="none"
        aria-label={`${title} preview`}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
