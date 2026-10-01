'use client';

import { useEffect, useRef, useState } from 'react';
import OfferList from './offer-list';
import type { offers as Offers } from './content';

type Offer = (typeof Offers)[number];

const PHONE = '(max-width: 760px)';
const pad = (index: number) => String(index + 1).padStart(2, '0');
const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as React.CSSProperties;

/**
 * The two offers. Wide screens: side by side. Phones: a deck of two cards,
 * the website in front and its care right behind it, whose edge shows above
 * with its name. A tap on that edge (or a swipe on the card) brings it
 * forward: both are always in sight, and the section stays one screen tall.
 */
export default function OfferDeck({ offers }: { offers: Offer[] }) {
  const [deck, setDeck] = useState(false);
  const [front, setFront] = useState(0);
  // The card whose "Cosa include" is open. Turning the deck closes it: the
  // cards share one height, so a list left open behind would stretch the
  // front card as if it were open too.
  const [open, setOpen] = useState<number | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const phone = matchMedia(PHONE);
    const update = () => setDeck(phone.matches);
    update();
    phone.addEventListener('change', update);
    return () => phone.removeEventListener('change', update);
  }, []);

  const back = (front + 1) % offers.length;
  const behind = offers[back];
  const turn = () => {
    setFront(back);
    setOpen(null);
  };

  // A horizontal swipe on the front card turns the deck; vertical ones scroll.
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.6) turn();
  };

  return (
    <div
      className="gm-offers"
      data-deck={deck ? 'true' : undefined}
      onPointerDown={deck ? onPointerDown : undefined}
      onPointerUp={deck ? onPointerUp : undefined}
      onPointerCancel={() => { swipe.current = null; }}
    >
      {offers.map((offer, index) => {
        const hidden = deck && index !== front;
        return (
          <article
            key={offer.title}
            className="gm-offer"
            data-reveal
            data-place={deck ? (hidden ? 'back' : 'front') : undefined}
            data-primary={index === 0 ? 'true' : undefined}
            style={delay(index * 120)}
            inert={hidden}
            aria-hidden={hidden || undefined}
          >
            <p className="gm-offer-kicker"><span>{pad(index)}</span>{offer.kicker}</p>
            <h3>{offer.title}</h3>
            <p className="gm-offer-text">{offer.text}</p>
            {offer.price && <p className="gm-offer-price">{offer.price}</p>}
            <OfferList title={offer.title} items={offer.includes} open={open === index} onToggle={() => setOpen(open === index ? null : index)} />
            <a className={index === 0 ? 'gm-btn gm-btn--primary' : 'gm-btn gm-btn--ghost'} href="#contatti" data-cta={index === 0 ? 'servizio-sito' : 'servizio-manutenzione'}>
              {offer.cta} <span className="gm-btn-arrow" aria-hidden="true">→</span>
            </a>
          </article>
        );
      })}
      {deck && (
        <button type="button" className="gm-deck-peek" onClick={turn}>
          <span className="gm-sr-only">Mostra </span>
          <span className="gm-deck-peek-number">{pad(back)}</span>
          <span className="gm-deck-peek-name">
            <span className="gm-deck-peek-kicker">{behind.kicker.split(' · ')[0]}</span>
            <strong>{behind.title}</strong>
          </span>
          <i aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
