import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import localFont from 'next/font/local';
import { site } from './content';
import { MOTION_SCRIPT } from './motion';
import { OPENING_SCRIPT } from './opening';
import { openGraphBase, siteDescription, siteSummary } from './seo';
import StarSky from './star-sky';
import Tracking from './tracking';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'Siti web su misura e design digitale — GoMore', template: '%s — GoMore' },
  description: siteDescription,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: 'Web design',
  // Numbers in the copy are not phone numbers unless they are links.
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    ...openGraphBase,
    title: 'GoMore — Diamo forma a ciò che ti rende unico',
    description: siteSummary,
  },
  twitter: { card: 'summary_large_image', title: 'GoMore — Diamo forma a ciò che ti rende unico', description: siteSummary },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
};

export const viewport: Viewport = {
  themeColor: '#050606',
  colorScheme: 'dark',
};

// Hero typography: a clean contemporary sans against a sharp display italic
// drawn as its companion (Instrument Serif), bold enough to carry the promise.
// Self-hosted (latin subset, OFL) so the build never depends on Google Fonts:
// a failed download there silently swaps in a fallback and shifts the titles.
const heroSans = localFont({
  src: [{ path: './fonts/instrument-sans-latin.woff2', weight: '400 500', style: 'normal' }],
  variable: '--font-hero-sans',
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});
const heroSerif = localFont({
  src: [{ path: './fonts/instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' }],
  variable: '--font-hero-serif',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The phone opening marks <html> before hydration (opening.ts): expected.
    <html lang="it" className={`${heroSans.variable} ${heroSerif.variable}`} suppressHydrationWarning>
      <body>
        {/* The visitor's "Ferma le animazioni", restored before the first paint (motion.ts). */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
        {/* The home's phone opening, decided before the first paint (opening.ts). */}
        <script dangerouslySetInnerHTML={{ __html: OPENING_SCRIPT }} />
        {/* Moving stars behind every page and section. */}
        <StarSky />
        {children}
        {/* Vercel Web Analytics: anonymous, aggregated visits, no cookies (see the privacy policy). */}
        <Analytics />
        {/* The few clicks that matter (tracking.tsx): actions, direct contacts, requests sent. */}
        <Tracking />
      </body>
    </html>
  );
}
