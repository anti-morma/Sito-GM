import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'GM Studio — Siti web per host e case vacanza',
  description:
    'Siti web su misura per host Airbnb, case vacanza e property manager. Design, presentazione degli alloggi e percorsi di prenotazione diretta.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
