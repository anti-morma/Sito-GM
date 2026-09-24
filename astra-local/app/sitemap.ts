import type { MetadataRoute } from 'next';
import { site } from './content';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${site.url}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${site.url}/cookie`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
