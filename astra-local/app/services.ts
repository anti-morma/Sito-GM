// The studio's disciplines, shown as information on /servizi ("Le competenze"):
// a name and one line each. They have no pages of their own (old links to
// /servizi/<slug> are sent to /servizi, next.config.ts).

export type Service = {
  /** Stable id: the anchor of its structured data on /servizi. */
  slug: string;
  /** Short name. */
  name: string;
  /** What it is, in one line. */
  summary: string;
};

export const services: Service[] = [
  { slug: 'web-design', name: 'Web design', summary: 'Interfacce disegnate sul brand e su chi le usa: dall’architettura dei contenuti alla direzione visiva.' },
  { slug: 'sviluppo-web', name: 'Sviluppo web', summary: 'Codice scritto per il progetto: siti veloci, responsive, accessibili e facili da far crescere.' },
  { slug: 'ux-ui', name: 'UX/UI design', summary: 'Percorsi e interfacce che riducono attrito e dubbi: capire, scegliere, agire.' },
  { slug: '3d-webgl', name: '3D e WebGL', summary: '3D, WebGL e motion quando aiutano a capire o a ricordare, mai solo per stupire.' },
  { slug: 'ai', name: 'AI', summary: 'L’intelligenza artificiale come strumento: dove migliora contenuti, processi o interazione.' },
];
