import type React from 'react';

import Image from 'next/image';
import { ArrowDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

import { PROMPT_RESULTS } from '../constants/landing.constants';

export function PromptToResult(): React.ReactElement {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-3">
            See It in Action
          </Badge>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            From prompt to masterpiece
          </h2>
          <p className="mt-3 text-muted-foreground">
            Describe what you want. AI delivers in seconds.
          </p>
        </div>

        {/* Prompt → Result pairs */}
        <div className="mx-auto max-w-3xl space-y-8">
          {PROMPT_RESULTS.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 md:p-6">
                {/* Prompt */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Prompt
                  </p>
                  <p className="text-sm text-foreground italic leading-relaxed">
                    &ldquo;{item.prompt}&rdquo;
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <ArrowDown className="h-4 w-4 text-primary" />
                  </div>
                </div>

                {/* Result image */}
                <div className="relative overflow-hidden rounded-lg aspect-video">
                  <Image
                    src={item.image}
                    alt={`AI-generated result for: ${item.prompt.slice(0, 60)}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 720px"
                    className="object-cover"
                  />
                  <div className="absolute bottom-3 right-3 z-10">
                    <Badge variant="secondary">{item.resultLabel}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
