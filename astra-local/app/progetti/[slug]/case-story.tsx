import Link from 'next/link';
import ProjectPreview from '../../project-preview';
import SectionLabel from '../../section-label';
import StoryPath from './story-path';
import type { Project } from '../../content';
import '../story.css';

/** A case study told as a story (lalinga-oro.tsx, residenza-vedovelli.tsx):
 *  the project in a few lines, the site at work, then the chapters in one
 *  column to read from top to bottom, with a reading path beside them on
 *  computers. Each project writes its own chapters with the parts below;
 *  its words live in its own file, not in content.ts, so the projects page,
 *  the places page and the other case study keep the shared ones. */

const pad = (index: number) => String(index + 1).padStart(2, '0');
const NEW_TAB = <span className="gm-sr-only"> (si apre in una nuova scheda)</span>;
const hostOf = (project: Project) => project.href ? new URL(project.href).hostname.replace(/^www\./, '') : '';

/** A link to the client's live site, in a new tab. */
function Live({ project, className, label, children }: { project: Project; className: string; label?: string; children: React.ReactNode }) {
  if (!project.href) return null;
  return <a className={className} href={project.href} target="_blank" rel="noopener" aria-label={label} data-cta="sito-cliente" data-project={project.name}>{children}</a>;
}

/** The page's promise under the name is the project's headline
 *  (content.ts), the same line the projects page and the tiles show. */
export type Story = {
  /** The first line stands on its own, the others beside it. */
  intro: string[];
  /** Label and value, at a glance. "Online" is added from the project. */
  meta: [string, string][];
  /** The chapters, in reading order, as the path lists them. */
  path: { id: string; label: string }[];
};

export default function CaseStory({ project, index, total, story, children }: { project: Project; index: number; total: number; story: Story; children: React.ReactNode }) {
  const host = hostOf(project);
  return (
    <div className="gm-story">
      {/* Who, and what the work was, in a few lines. */}
      <section className="gm-st-hero gm-wrap" aria-labelledby="case-title">
        <nav className="gm-case-crumbs" aria-label="Percorso">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/progetti">Progetti</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{project.name}</span>
        </nav>
        <SectionLabel>Caso studio · {pad(index)} / {pad(total - 1)}</SectionLabel>
        <h1 className="gm-case-title" id="case-title">{project.name}</h1>
        <p className="gm-st-headline"><em>{project.study?.headline}</em></p>
        <div className="gm-st-intro">
          <p className="gm-st-intro-first">{story.intro[0]}</p>
          {story.intro.slice(1).map((text) => <p key={text}>{text}</p>)}
        </div>
        <dl className="gm-st-meta">
          {story.meta.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}
          {project.href && (
            <div><dt>Online</dt><dd><Live project={project} className="gm-case-live">{host} <span aria-hidden="true">↗</span>{NEW_TAB}</Live></dd></div>
          )}
        </dl>
      </section>

      {/* The site at work: it plays as soon as it appears, a click opens it. */}
      {project.preview && (
        <section className="gm-st-showcase gm-wrap" aria-label={`Il sito di ${project.name}`}>
          <Live project={project} className="gm-case-screen" label={`Apri il sito di ${project.name} in una nuova scheda`}>
            <div className="gm-case-screen-bar" aria-hidden="true"><i /><i /><i /><span>{host}</span></div>
            <div className="gm-case-screen-view">
              <ProjectPreview src={project.preview} name={project.name} only="wide" focus={0.05} />
              <span className="gm-project-hover" aria-hidden="true">Visita il sito <span>↗</span></span>
            </div>
          </Live>
        </section>
      )}

      {/* The story, read as one path: the chapters by name beside it
          (computers), the text in one column. */}
      <div className="gm-st-story gm-wrap">
        <aside className="gm-st-aside">
          <StoryPath items={story.path} />
        </aside>
        <div className="gm-st-flow">{children}</div>
      </div>
    </div>
  );
}

/** One chapter: its title, then its own layout. */
export function Part({ id, title, children, className = '' }: { id: string; title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`gm-st-part ${className}`} aria-labelledby={`${id}-title`} data-story-chapter={id}>
      <h2 className="gm-st-heading" id={`${id}-title`} data-reveal>{title}</h2>
      {children}
    </section>
  );
}

/** A sentence in two tones: what is, then the turn. */
export function Statement({ text, turn }: { text: string; turn?: string }) {
  return (
    <div data-reveal>
      <p className="gm-st-statement">{text}</p>
      {turn && <p className="gm-st-turn">{turn}</p>}
    </div>
  );
}

/** Text in one measure: a strong first or last line in white. `after`
 *  sets it apart from a large line above. */
export function Prose({ strong, lines, last, after }: { strong?: string; lines: string[]; last?: string; after?: boolean }) {
  return (
    <div className={after ? 'gm-st-prose gm-st-prose--after' : 'gm-st-prose'} data-reveal>
      {strong && <p className="gm-st-strong">{strong}</p>}
      {lines.map((line) => <p key={line}>{line}</p>)}
      {last && <p className="gm-st-strong">{last}</p>}
    </div>
  );
}

/** A row of names, each with its full stop: Lalinga's six worlds,
 *  Vedovelli's three languages. */
export function Names({ label, items }: { label: string; items: string[] }) {
  return (
    <ul className="gm-st-worlds" aria-label={label} data-reveal>
      {items.map((item) => <li key={item}>{item}.</li>)}
    </ul>
  );
}

/** The goals, each under the one word it is about: part of the chapter before. */
export function Goals({ chapter, items }: { chapter: string; items: { word: string; text: string }[] }) {
  return (
    <section className="gm-st-part gm-st-part--goals" aria-labelledby={`${chapter}-goals`} data-story-chapter={chapter}>
      <h3 className="gm-st-kicker" id={`${chapter}-goals`} data-reveal>Gli obiettivi</h3>
      <ul className="gm-st-goals" data-reveal>
        {items.map((goal) => (
          <li key={goal.word}>
            <strong>{goal.word}</strong>
            <span>{goal.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The decision as one large line, the turn in the italic. */
export function Manifesto({ text, turn }: { text: string; turn: string }) {
  return <p className="gm-st-manifesto" data-reveal>{text} <em>{turn}</em></p>;
}

/** Two columns: the reasoning, and the lines it leads to (`linesFirst`:
 *  the lines on the left, when they come first in the story). */
export function Pair({ prose, lines, last, linesFirst }: { prose: string[]; lines: string[]; last?: string; linesFirst?: boolean }) {
  return (
    <div className={linesFirst ? 'gm-st-pair gm-st-pair--lines-first' : 'gm-st-pair'} data-reveal>
      <div className="gm-st-prose">{prose.map((text) => <p key={text}>{text}</p>)}</div>
      <div className="gm-st-paths">
        {lines.map((line) => <p key={line}>{line}</p>)}
        {last && <p className="gm-st-strong">{last}</p>}
      </div>
    </div>
  );
}

/** Sides of the experience, each under its name: a strong first line, then the rest. */
export function Blocks({ items }: { items: { title: string; text: string[] }[] }) {
  return (
    <div className="gm-st-blocks">
      {items.map((block) => (
        <article key={block.title} className="gm-st-block" data-reveal>
          <h3>{block.title}</h3>
          <div>
            {block.text.map((text, i) => <p key={text} className={i ? undefined : 'gm-st-block-lead'}>{text}</p>)}
          </div>
        </article>
      ))}
    </div>
  );
}

/** The proof, quieter: a sentence and a list of stars. */
export function Proof({ intro, items }: { intro: string; items: string[] }) {
  return (
    <div className="gm-st-proof" data-reveal>
      <p>{intro}</p>
      <ul className="gm-st-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

/** The words, and the phone recording beside them. */
export function Phone({ project, strong, lines }: { project: Project; strong: string; lines: string[] }) {
  return (
    <div className="gm-st-phone" data-reveal>
      <div className="gm-st-prose">
        <p className="gm-st-strong">{strong}</p>
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
      {project.preview && (
        <div className="gm-case-phone-frame">
          <ProjectPreview src={project.preview} name={project.name} only="phone" />
        </div>
      )}
    </div>
  );
}

/** The result: one sentence, the largest of the story, its end in the italic. */
export function Result({ text, turn }: { text: string; turn: string }) {
  return <p className="gm-st-result" data-reveal>{text} <em>{turn}</em></p>;
}

/** What we built, then the way to the live site. */
export function Built({ project, items }: { project: Project; items: string[] }) {
  return (
    <>
      <ul className="gm-st-list gm-st-credits" data-reveal>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      <Live project={project} className="gm-btn gm-btn--ghost gm-st-visit">Visita {hostOf(project)} <span className="gm-btn-arrow" aria-hidden="true">↗</span>{NEW_TAB}</Live>
    </>
  );
}
