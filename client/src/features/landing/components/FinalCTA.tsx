import type React from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

export function FinalCTA(): React.ReactElement {
  return (
    <section className="bg-muted/20 py-16 md:py-24">
      <div className="container mx-auto flex flex-col items-center px-4 text-center">
        <h2 className="text-xl font-bold text-foreground md:text-2xl lg:text-3xl">
          Ready to create something remarkable?
        </h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          Join thousands of creators using AI to bring their vision to life.
          Start free — no credit card required.
        </p>
        <Button size="lg" asChild className="mt-6">
          <Link href={ROUTES.REGISTER}>Start creating for free</Link>
        </Button>
      </div>
    </section>
  );
}
