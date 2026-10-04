import type { MetadataRoute } from 'next';
import { caseStudies, site } from './content';
import { wherePath } from './places';
import { studyPath } from './seo';

// Only canonical pages that belong in search results, built from the same
// data as the pages: a new project appears here by itself.
// Dates are moved by hand when a page's content changes: a sitemap that
// claims every page changed today teaches search engines to ignore the field.
const UPDATED = new Date('2026-10-02');

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: 'monthly' | 'yearly' = 'yearly', images?: string[]) => ({
    url: `${site.url}${path}`,
    lastModified: UPDATED,
    changeFrequency,
    priority,
    ...(images ? { images } : {}),
  });
  return [
    page('/', 1, 'monthly', [`${site.url}/opengraph-image.png`]),
    page('/servizi', 0.9, 'monthly'),
    page('/progetti', 0.9, 'monthly'),
    ...caseStudies.map((project) => page(studyPath(project.study), 0.8, 'yearly',
      project.preview ? [`${site.url}${project.preview}-poster.jpg`, `${site.url}${project.preview}-m-poster.jpg`] : undefined)),
    page('/chi-siamo', 0.7),
    page(wherePath, 0.7),
    page('/contatti', 0.7),
    page('/privacy', 0.2),
    page('/cookie', 0.2),
  ];
}
