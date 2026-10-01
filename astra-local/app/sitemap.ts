import type { MetadataRoute } from 'next';
import { caseStudies, site } from './content';
import { studyPath } from './seo';

// A fixed date, moved by hand when the content changes: a sitemap that claims
// every page changed today teaches search engines to ignore the field.
const UPDATED = new Date('2026-09-30');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 1, images: [`${site.url}/opengraph-image.png`] },
    ...caseStudies.map((project) => ({
      url: `${site.url}${studyPath(project.study)}`,
      lastModified: UPDATED,
      changeFrequency: 'yearly' as const,
      priority: 0.8,
      images: project.preview ? [`${site.url}${project.preview}-poster.jpg`, `${site.url}${project.preview}-m-poster.jpg`] : [],
    })),
    { url: `${site.url}/privacy`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${site.url}/cookie`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
