import type React from 'react';

import { HowItWorksClient } from './HowItWorksClient';

export function HowItWorks(): React.ReactElement {
  return (
    <section aria-labelledby="how-it-works-heading" className="how-it-works-section">
      <HowItWorksClient />
    </section>
  );
}
