'use client';

import type React from 'react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';

import { TESTIMONIALS } from '../constants/landing.constants';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function Testimonials(): React.ReactElement {
  return (
    <section className="bg-muted/20 py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="mb-10 text-center">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            Loved by creators worldwide
          </h2>
          <p className="mt-3 text-muted-foreground">
            Thousands of professionals trust us with their content
          </p>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{ align: 'start', loop: true }}
          className="mx-auto max-w-5xl"
        >
          <CarouselContent className="-ml-4">
            {TESTIMONIALS.map((testimonial) => (
              <CarouselItem
                key={testimonial.id}
                className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
              >
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col p-5">
                    {/* Quote */}
                    <p className="flex-1 text-sm text-foreground italic leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {getInitials(testimonial.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-6 flex justify-center gap-2">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
