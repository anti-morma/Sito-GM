import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'GoMore — Creazione siti web su misura',
  description:
    'Siti web ed esperienze digitali su misura: strategia, web design, sviluppo, UX, 3D, motion e AI per far percepire il tuo progetto per ciò che vale.',
};
// Hero typography: a clean contemporary sans against an editorial italic serif.
// Self-hosted (latin subset, OFL) so the build never depends on Google Fonts:
// a failed download there silently swaps in a fallback and shifts the titles.
const heroSans = localFont({
  src: [{ path: './fonts/instrument-sans-latin.woff2', weight: '400 500', style: 'normal' }],
  variable: '--font-hero-sans',
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});
const heroSerif = localFont({
  src: [{ path: './fonts/cormorant-garamond-500-italic-latin.woff2', weight: '500', style: 'italic' }],
  variable: '--font-hero-serif',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${heroSans.variable} ${heroSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
