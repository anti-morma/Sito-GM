'use client';

import { useId, useState } from 'react';

export default function OfferList({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="gm-offer-details">
      <button className="gm-offer-toggle" type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        Cosa include
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <ul id={id} className="gm-offer-list" data-open={open} aria-label={`Cosa include: ${title}`}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
