import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { site } from './content';
import StarSky from './star-sky';
import './globals.css';

const description = 'GoMore è uno studio digitale indipendente: progettiamo e sviluppiamo siti web su misura, dalla strategia al design, dallo sviluppo al 3D, perché il tuo progetto venga percepito per ciò che vale.';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'GoMore — Siti web su misura e design digitale', template: '%s — GoMore' },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: '/',
    siteName: site.name,
    title: 'GoMore — Diamo forma a ciò che ti rende unico',
    description,
  },
  twitter: { card: 'summary_large_image', title: 'GoMore — Diamo forma a ciò che ti rende unico', description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#050606',
  colorScheme: 'dark',
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      logo: `${site.url}/icon.png`,
      description,
      ...(site.email ? { email: site.email } : {}),
      ...(site.legalName ? { legalName: site.legalName } : {}),
      ...(site.vat ? { vatID: site.vat } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': `${site.url}/#website`,
      url: site.url,
      name: site.name,
      inLanguage: 'it-IT',
      publisher: { '@id': `${site.url}/#organization` },
    },
  ],
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
    <html lang="it" className={`${heroSans.variable} ${heroSerif.variable}`}>
      <body>
        {/* Moving stars behind every page and section. */}
        <StarSky />
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}
