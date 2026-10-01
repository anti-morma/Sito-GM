// Everything search engines and AI assistants read about the studio, in one
// place: the descriptions, the structured data (schema.org JSON-LD) of the
// home and of every case study, and the local details from content.ts.
import { areaServed, offers, projects, site, type CaseStudy, type Project } from './content';

/** Under 160 characters: Google shows it whole under the title. */
export const siteDescription = 'Studio digitale indipendente: progettiamo e sviluppiamo siti web su misura, dalla strategia al design, dallo sviluppo al 3D. Parliamo del tuo progetto.';

/** The longer version, for social previews and the structured data. */
export const siteSummary = `${site.name} è uno studio digitale indipendente: progettiamo e sviluppiamo siti web su misura, dalla strategia al design, dallo sviluppo al 3D, perché il tuo progetto venga percepito per ciò che vale.`;

/** Shared by every page's Open Graph: a page that sets its own replaces the
 *  whole block, so each one spreads this first. */
export const openGraphBase = { type: 'website' as const, locale: 'it_IT', siteName: site.name };

export const organizationId = `${site.url}/#organization`;
const websiteId = `${site.url}/#website`;

export const studyPath = (study: CaseStudy) => `/progetti/${study.slug}`;

const postalAddress = () =>
  site.city
    ? {
        '@type': 'PostalAddress',
        ...(site.street ? { streetAddress: site.street } : {}),
        addressLocality: site.city,
        ...(site.region ? { addressRegion: site.region } : {}),
        ...(site.postalCode ? { postalCode: site.postalCode } : {}),
        addressCountry: 'IT',
      }
    : undefined;

/** The studio: an organisation and a local professional service. */
export function organizationLd() {
  const address = postalAddress();
  return {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': organizationId,
    name: site.name,
    url: site.url,
    logo: { '@type': 'ImageObject', url: `${site.url}/icon.png` },
    image: `${site.url}/opengraph-image.png`,
    description: siteSummary,
    slogan: 'Diamo forma a ciò che ti rende unico.',
    areaServed: { '@type': 'Country', name: areaServed },
    knowsAbout: ['Siti web su misura', 'Web design', 'Sviluppo web', 'UX design', 'Brand experience', 'Animazioni e 3D per il web', 'SEO tecnica'],
    makesOffer: offers.map((offer) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: offer.title, description: offer.text, provider: { '@id': organizationId }, areaServed: areaServed },
    })),
    ...(address ? { address } : {}),
    ...(site.email ? { email: site.email } : {}),
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.legalName ? { legalName: site.legalName } : {}),
    ...(site.vat ? { vatID: site.vat } : {}),
    ...(site.profiles.length ? { sameAs: site.profiles } : {}),
  };
}

export function websiteLd() {
  return {
    '@type': 'WebSite',
    '@id': websiteId,
    url: site.url,
    name: site.name,
    description: siteDescription,
    inLanguage: 'it-IT',
    publisher: { '@id': organizationId },
  };
}

/** The home: the studio's page, with its portfolio as a list of case studies. */
export function homeLd() {
  const studies = projects.filter((project) => project.study);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationLd(),
      websiteLd(),
      {
        '@type': 'WebPage',
        '@id': `${site.url}/#webpage`,
        url: site.url,
        name: `Siti web su misura e design digitale — ${site.name}`,
        description: siteDescription,
        inLanguage: 'it-IT',
        isPartOf: { '@id': websiteId },
        about: { '@id': organizationId },
        primaryImageOfPage: `${site.url}/opengraph-image.png`,
      },
      {
        '@type': 'ItemList',
        name: 'Progetti',
        itemListElement: studies.map((project, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${site.url}${studyPath(project.study!)}`,
          name: project.name,
        })),
      },
    ],
  };
}

/** A case study: the work, who it was for, and where it sits in the site. */
export function studyLd(project: Project & { study: CaseStudy }) {
  const url = `${site.url}${studyPath(project.study)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        '@id': `${url}#work`,
        url,
        name: `${project.name} — ${project.study.headline}`,
        headline: project.study.headline,
        description: project.description,
        inLanguage: 'it-IT',
        genre: project.category,
        image: project.preview ? `${site.url}${project.preview}-poster.jpg` : undefined,
        creator: { '@id': organizationId },
        publisher: { '@id': organizationId },
        ...(project.study.year ? { dateCreated: project.study.year } : {}),
        about: {
          '@type': 'Organization',
          name: project.name,
          description: project.study.client,
          ...(project.href ? { url: project.href } : {}),
          address: { '@type': 'PostalAddress', addressLocality: project.study.place, addressCountry: 'IT' },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.name, item: `${site.url}/` },
          { '@type': 'ListItem', position: 2, name: 'Progetti', item: `${site.url}/#progetti` },
          { '@type': 'ListItem', position: 3, name: project.name, item: url },
        ],
      },
      organizationLd(),
    ],
  };
}

/** A JSON-LD script, safe to inline. */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });
