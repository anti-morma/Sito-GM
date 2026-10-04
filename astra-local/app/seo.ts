// Everything search engines and AI assistants read about the studio, in one
// place: the descriptions, each page's metadata (pageMetadata) and the
// structured data (schema.org JSON-LD), built from content.ts, services.ts and
// places.ts so they never say something the pages do not.
//
// The structured data is one graph. The studio is declared in full once per
// page that is about it (home, chi siamo, contatti) under a stable @id; every
// other page points to that @id, so search engines see one entity, not ten.
import type { Metadata } from 'next';
import { areaServed, caseStudies, founders, offers, projects, site, type CaseStudy, type Project } from './content';
import { cities, where, wherePath } from './places';
import { servicePath, services, type Service } from './services';

/** Under 160 characters: Google shows it whole under the title. */
export const siteDescription = 'GoMore progetta e sviluppa esperienze digitali su misura unendo strategia, UX, design, sviluppo, 3D, WebGL e AI.';

/** The longer version, for social previews and the structured data. */
export const siteSummary = `${site.name} è uno studio digitale indipendente: progetta e sviluppa siti web ed esperienze digitali su misura, unendo strategia, UX/UI, design, sviluppo, 3D, WebGL e AI. Ogni progetto parte da ciò che deve ottenere.`;

/** Shared by every page's Open Graph: a page that sets its own replaces the
 *  whole block, so each one spreads this first. */
export const openGraphBase = { type: 'website' as const, locale: 'it_IT', siteName: site.name };

/** Homepage capture. Use a new filename for each update to bypass image caches. */
export const OG_IMAGE = { url: '/gomore-home-20261004.jpg', width: 1185, height: 630, alt: `${site.name} — Più di un sito. La tua identità, online.` };

export const organizationId = `${site.url}/#organization`;
const websiteId = `${site.url}/#website`;

export const studyPath = (study: CaseStudy) => `/progetti/${study.slug}`;

/** The "Chi siamo" page. */
export const aboutPath = '/chi-siamo';
export const aboutDescription = 'Scopri GoMore: strategia, UX, design, sviluppo e creative technology per costruire esperienze digitali con una direzione.';

const personId = (name: string) => `${site.url}${aboutPath}#${name.toLowerCase().replace(/\s+/g, '-')}`;
const serviceId = (service: Service) => `${site.url}${servicePath(service)}#service`;
const pageId = (path: string) => `${site.url}${path === '/' ? '' : path}#webpage`;

// ---------------------------------------------------------------------------
// Metadata

/**
 * One page's metadata: title (the layout adds "| GoMore"), description,
 * canonical, Open Graph and Twitter card. `index: false` keeps a page out of
 * search results while its links are still followed.
 */
export function pageMetadata({ path, title, description, image, type = 'website', index = true }: {
  path: string;
  title: string;
  description: string;
  image?: { url: string; width: number; height: number; alt: string };
  type?: 'website' | 'article';
  index?: boolean;
}): Metadata {
  const social = `${title} | ${site.name}`;
  const picture = image ?? OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...openGraphBase, type, url: path, title: social, description, images: [picture] },
    twitter: { card: 'summary_large_image', title: social, description, images: [picture.url] },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}

// ---------------------------------------------------------------------------
// Entities

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

const cityLd = (item: (typeof cities)[number]) => ({ '@type': 'City', name: item.city, sameAs: item.sameAs });

/**
 * The studio. A local business (ProfessionalService) only once it has a real
 * address in content.ts: until then an Organization that serves Italy and
 * the two cities it is present in, with no office claimed anywhere.
 */
export function organizationLd() {
  const address = postalAddress();
  return {
    '@type': address ? ['Organization', 'ProfessionalService'] : 'Organization',
    '@id': organizationId,
    name: site.name,
    url: site.url,
    logo: { '@type': 'ImageObject', url: `${site.url}/icon.png` },
    image: `${site.url}/opengraph-image.png`,
    description: siteSummary,
    slogan: 'Un sito all’altezza di ciò che fai.',
    areaServed: [{ '@type': 'Country', name: areaServed }, ...cities.map(cityLd)],
    knowsAbout: ['Web design', 'Sviluppo web', 'UX design', 'UI design', 'Strategia digitale', 'Siti web su misura', '3D per il web', 'WebGL', 'Intelligenza artificiale', 'Digital experience', 'SEO tecnica'],
    founder: founders.map((person) => ({ '@type': 'Person', '@id': personId(person.name), name: person.name })),
    // The disciplines (each declared on its own page) and the two ways to work with the studio.
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servizi',
      itemListElement: services.map((service) => ({ '@type': 'Offer', itemOffered: { '@id': serviceId(service) } })),
    },
    makesOffer: offers.map((offer) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: offer.title, description: offer.text, provider: { '@id': organizationId }, areaServed },
      // A real, published starting price only (content.ts).
      ...(offer.monthlyFrom ? { priceSpecification: { '@type': 'UnitPriceSpecification', minPrice: offer.monthlyFrom, priceCurrency: 'EUR', unitText: 'mese' } } : {}),
    })),
    ...(address ? { address } : {}),
    ...(site.email ? { email: site.email } : {}),
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.legalName ? { legalName: site.legalName } : {}),
    ...(site.vat ? { vatID: site.vat } : {}),
    ...(site.profiles.length ? { sameAs: site.profiles } : {}),
  };
}

/** On pages that are not about the studio itself: who publishes them, by reference. */
const organizationRef = () => ({ '@type': 'Organization', '@id': organizationId, name: site.name, url: site.url });

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

type Crumb = { name: string; path: string };

const breadcrumbLd = (path: string, crumbs: Crumb[]) => ({
  '@type': 'BreadcrumbList',
  '@id': `${site.url}${path}#breadcrumb`,
  itemListElement: [{ name: site.name, path: '/' }, ...crumbs].map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: `${site.url}${crumb.path === '/' ? '/' : crumb.path}`,
  })),
});

/** A page of the site: its WebPage node, its breadcrumbs, and what it is about. */
function webPageLd({ path, type = 'WebPage', name, description, crumbs, about = { '@id': organizationId }, extra = {} }: {
  path: string;
  type?: string;
  name: string;
  description: string;
  crumbs?: Crumb[];
  about?: unknown;
  extra?: Record<string, unknown>;
}) {
  return {
    '@type': type,
    '@id': pageId(path),
    url: `${site.url}${path === '/' ? '' : path}`,
    name,
    description,
    inLanguage: 'it-IT',
    isPartOf: { '@id': websiteId },
    about,
    ...(crumbs ? { breadcrumb: { '@id': `${site.url}${path}#breadcrumb` } } : {}),
    ...extra,
  };
}

const graph = (...nodes: unknown[]) => ({ '@context': 'https://schema.org', '@graph': nodes });

// ---------------------------------------------------------------------------
// One graph per page

/** The home: the studio's page, with its work as a list of case studies. */
export function homeLd() {
  return graph(
    organizationLd(),
    websiteLd(),
    webPageLd({ path: '/', name: `${site.name} | Web design, sviluppo e digital experiences`, description: siteDescription, extra: { primaryImageOfPage: `${site.url}/opengraph-image.png` } }),
    {
      '@type': 'ItemList',
      name: 'Progetti',
      itemListElement: caseStudies.map((project, index) => ({ '@type': 'ListItem', position: index + 1, url: `${site.url}${studyPath(project.study)}`, name: project.name })),
    },
  );
}

/** "Chi siamo": the studio's own page, and the two people behind it. */
export function aboutLd() {
  const path = aboutPath;
  return graph(
    webPageLd({ path, type: 'AboutPage', name: `Chi siamo | ${site.name}`, description: aboutDescription, crumbs: [{ name: 'Chi siamo', path }], extra: { mainEntity: { '@id': organizationId } } }),
    ...founders.map((person) => ({
      '@type': 'Person',
      '@id': personId(person.name),
      name: person.name,
      jobTitle: `Co-founder · ${person.role}`,
      description: person.text,
      knowsAbout: person.knowsAbout,
      worksFor: { '@id': organizationId },
    })),
    breadcrumbLd(path, [{ name: 'Chi siamo', path }]),
    organizationLd(),
    websiteLd(),
  );
}

/** /servizi: the disciplines, as a list. */
export function servicesLd(description: string) {
  const path = '/servizi';
  return graph(
    webPageLd({
      path,
      type: 'CollectionPage',
      name: `Servizi | ${site.name}`,
      description,
      crumbs: [{ name: 'Servizi', path }],
      extra: { mainEntity: { '@type': 'ItemList', itemListElement: services.map((service, index) => ({ '@type': 'ListItem', position: index + 1, url: `${site.url}${servicePath(service)}`, name: service.name })) } },
    }),
    breadcrumbLd(path, [{ name: 'Servizi', path }]),
    organizationRef(),
  );
}

/** A service page: the Service, offered by the studio, and the work that shows it. */
export function serviceLd(service: Service) {
  const path = servicePath(service);
  const crumbs = [{ name: 'Servizi', path: '/servizi' }, { name: service.name, path }];
  return graph(
    webPageLd({ path, name: `${service.seoTitle} | ${site.name}`, description: service.description, crumbs, about: { '@id': serviceId(service) } }),
    {
      '@type': 'Service',
      '@id': serviceId(service),
      name: service.name,
      serviceType: service.name,
      description: service.description,
      url: `${site.url}${path}`,
      provider: { '@id': organizationId },
      areaServed: [{ '@type': 'Country', name: areaServed }, ...cities.map(cityLd)],
    },
    breadcrumbLd(path, crumbs),
    organizationRef(),
  );
}

/** /progetti: the case studies, as a list. */
export function projectsLd(description: string) {
  const path = '/progetti';
  return graph(
    webPageLd({
      path,
      type: 'CollectionPage',
      name: `Progetti | ${site.name}`,
      description,
      crumbs: [{ name: 'Progetti', path }],
      extra: { mainEntity: { '@type': 'ItemList', itemListElement: caseStudies.map((project, index) => ({ '@type': 'ListItem', position: index + 1, url: `${site.url}${studyPath(project.study)}`, name: project.name })) } },
    }),
    breadcrumbLd(path, [{ name: 'Progetti', path }]),
    organizationRef(),
  );
}

/** A case study: the work, who it was for, and where it sits in the site. */
export function studyLd(project: Project & { study: CaseStudy }) {
  const path = studyPath(project.study);
  const url = `${site.url}${path}`;
  const crumbs = [{ name: 'Progetti', path: '/progetti' }, { name: project.name, path }];
  return graph(
    webPageLd({ path, name: `${project.study.seoTitle} | ${site.name}`, description: project.study.seoDescription, crumbs, about: { '@id': `${url}#work` } }),
    {
      '@type': 'CreativeWork',
      '@id': `${url}#work`,
      url,
      name: `${project.name} — ${project.study.headline}`,
      headline: project.study.headline,
      description: project.description,
      inLanguage: 'it-IT',
      genre: 'Sito web',
      image: project.preview ? `${site.url}${project.preview}-poster.jpg` : undefined,
      creator: { '@id': organizationId },
      publisher: { '@id': organizationId },
      ...(project.study.year ? { dateCreated: project.study.year } : {}),
      ...(project.href ? { sameAs: project.href } : {}),
      about: {
        '@type': 'Organization',
        name: project.name,
        description: project.study.client,
        ...(project.href ? { url: project.href } : {}),
        address: { '@type': 'PostalAddress', addressLocality: project.study.place, addressCountry: 'IT' },
      },
    },
    breadcrumbLd(path, crumbs),
    organizationRef(),
  );
}

/** Where we work: the studio, and the two cities it is present in (no office claimed). */
export function whereLd() {
  const path = wherePath;
  const crumbs = [{ name: 'Dove lavoriamo', path }];
  return graph(
    webPageLd({ path, name: `${where.seoTitle} | ${site.name}`, description: where.description, crumbs, about: [{ '@id': organizationId }, ...cities.map(cityLd)] }),
    breadcrumbLd(path, crumbs),
    organizationRef(),
  );
}

/** /contatti: how to reach the studio. */
export function contactLd(description: string) {
  const path = '/contatti';
  return graph(
    webPageLd({ path, type: 'ContactPage', name: `Contatti | ${site.name}`, description, crumbs: [{ name: 'Contatti', path }], extra: { mainEntity: { '@id': organizationId } } }),
    breadcrumbLd(path, [{ name: 'Contatti', path }]),
    organizationLd(),
    websiteLd(),
  );
}

/** Every service, project and the where page: the pages that belong in search results. */
export const indexablePaths = () => [
  ...services.map(servicePath),
  ...caseStudies.map((project) => studyPath(project.study)),
  wherePath,
];

/** Projects linked from elsewhere by slug (services.ts). */
export const projectBySlug = (slug: string) => projects.find((project) => project.study?.slug === slug);

/** A JSON-LD script, safe to inline. */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });
