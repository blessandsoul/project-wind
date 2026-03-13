'use client';

import type React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { FAQ_ITEMS } from '../constants/landing.constants';

export function FAQ(): React.ReactElement {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="mb-10 text-center">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know before getting started
          </p>
        </div>

        {/* Accordion */}
        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible>
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-sm font-medium md:text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
