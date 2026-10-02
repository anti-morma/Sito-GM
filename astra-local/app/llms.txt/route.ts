import { areaServed, caseStudies, founders, housePhases, offers, site } from '../content';
import { cityNames, wherePath } from '../places';
import { aboutPath, siteSummary, studyPath } from '../seo';
import { servicePath, services } from '../services';

// /llms.txt: the studio in plain text for AI assistants and answer engines
// (ChatGPT, Perplexity, Gemini, Claude), which increasingly answer "who can
// build my website?" by reading sites directly. Built from content.ts, so it
// never drifts from the page.
export const dynamic = 'force-static';

export function GET() {
  const place = [site.city, site.region].filter(Boolean).join(', ');
  const lines = [
    `# ${site.name}`,
    '',
    `> ${siteSummary}`,
    '',
    `Studio digitale indipendente${place ? ` con sede a ${place}` : ''}. Lavora con clienti in tutta ${areaServed}. Lingua: italiano.`,
    '',
    '## Chi siamo',
    `Due fondatori, una direzione: si parte dal problema, dall’obiettivo e dalle persone; la tecnologia (3D, WebGL, motion, AI) solo quando crea un vantaggio reale. Pagina: ${site.url}${aboutPath}`,
    ...founders.map((person) => `- ${person.name} (${person.role}): ${person.text}`),
    '',
    '## Servizi',
    `Panoramica: ${site.url}/servizi`,
    ...services.map((service) => `- [${service.name}](${site.url}${servicePath(service)}): ${service.summary}`),
    '',
    '## Come si lavora insieme',
    ...offers.map((offer) => `- ${offer.title}: ${offer.text}${offer.price ? ` ${offer.price}.` : ''} Include: ${offer.includes.join('; ')}.`),
    '',
    '## Metodo',
    ...housePhases.map((phase, index) => `${index + 1}. ${phase.title}: ${phase.text}`),
    '',
    '## Progetti',
    `Tutti i casi studio: ${site.url}/progetti`,
    ...caseStudies.map((project) => `- [${project.name}](${site.url}${studyPath(project.study)}): ${project.description}${project.href ? ` Sito: ${project.href}` : ''}`),
    '',
    '## Dove lavoriamo',
    `Presenti a ${cityNames}, al lavoro con clienti in tutta ${areaServed}: ${site.url}${wherePath}`,
    '',
    '## Contatti',
    `- Modulo di contatto: ${site.url}/contatti`,
    ...(site.email ? [`- Email: ${site.email}`] : []),
    ...(site.phone ? [`- Telefono: ${site.phone}`] : []),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
