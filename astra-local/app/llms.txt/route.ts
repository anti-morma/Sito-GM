import { areaServed, caseStudies, housePhases, offers, site } from '../content';
import { siteSummary, studyPath } from '../seo';

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
    '## Servizi',
    ...offers.map((offer) => `- ${offer.title}: ${offer.text} Include: ${offer.includes.join('; ')}.`),
    '',
    '## Metodo',
    ...housePhases.map((phase, index) => `${index + 1}. ${phase.title}: ${phase.text}`),
    '',
    '## Progetti',
    ...caseStudies.map((project) => `- [${project.name}](${site.url}${studyPath(project.study)}): ${project.description}${project.href ? ` Sito: ${project.href}` : ''}`),
    '',
    '## Contatti',
    `- Modulo di contatto: ${site.url}/#contatti`,
    ...(site.email ? [`- Email: ${site.email}`] : []),
    ...(site.phone ? [`- Telefono: ${site.phone}`] : []),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
