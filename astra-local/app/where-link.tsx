import Link from 'next/link';
import { cities, wherePath } from './places';

/**
 * The way to "Dove lavoriamo" from every page: a small button with a map pin,
 * in the footer and in the phone menu. It names the cities and the rest of
 * the country, so it reads as an answer before it is clicked.
 */
export default function WhereLink({ current = false, onClick }: { current?: boolean; onClick?: () => void }) {
  return (
    <Link className="gm-where-link" href={wherePath} onClick={onClick} aria-current={current ? 'page' : undefined}>
      <svg viewBox="0 0 16 20" width="13" height="16" aria-hidden="true">
        <path d="M8 19s6-6.2 6-11A6 6 0 0 0 2 8c0 4.8 6 11 6 11Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8" cy="8" r="2.2" fill="currentColor" />
      </svg>
      <span>{cities.map((item) => item.city).join(' · ')} · tutta Italia</span>
      <span className="gm-btn-arrow" aria-hidden="true">→</span>
      <span className="gm-sr-only"> — dove lavoriamo</span>
    </Link>
  );
}
