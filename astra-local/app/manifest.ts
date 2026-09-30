import type { MetadataRoute } from 'next';
import { site } from './content';
import { siteDescription } from './seo';

// Added to a phone's home screen, the site opens with its own name, icon and night sky.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — Siti web su misura`,
    short_name: site.name,
    description: siteDescription,
    lang: 'it',
    start_url: '/',
    display: 'standalone',
    background_color: '#050606',
    theme_color: '#050606',
    icons: [
      { src: '/icon.png', sizes: 'any', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
