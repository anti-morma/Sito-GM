import type { Metadata } from 'next';
import { Cormorant_Garamond, Instrument_Sans } from 'next/font/google';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'GoMore — Creazione siti web su misura',
  description:
    'Siti web ed esperienze digitali su misura: strategia, web design, sviluppo, UX, 3D, motion e AI per far percepire il tuo progetto per ciò che vale.',
};
// Hero typography: a clean contemporary sans against an editorial italic serif.
const heroSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-hero-sans',
  display: 'swap',
});
const heroSerif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500'],
  style: ['italic'],
  variable: '--font-hero-serif',
  display: 'swap',
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
