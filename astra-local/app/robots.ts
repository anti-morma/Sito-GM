import type { MetadataRoute } from 'next';
import { site } from './content';

// Public pages, styles, scripts and images are all open to crawlers; only the
// form's endpoint is not a page. Pages kept out of results use noindex
// (seo.ts), not this file. Vercel's preview copies are closed entirely.
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === 'preview') return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
