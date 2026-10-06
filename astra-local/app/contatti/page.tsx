import ContactForm from '../_contact/form';
import GrowTextarea from '../grow-textarea';
import Reveal from '../reveal';
import SiteFooter from '../site-footer';
import { PageIntro } from '../inner';
import { nextSteps, site } from '../content';
import { contactLd, jsonLd, pageMetadata } from '../seo';
import { ContactWays, contactDetails } from '../studio-details';

const DESCRIPTION = 'Raccontaci che cosa vuoi costruire: un sito web su misura, un rinnovo, un’esperienza 3D. Ti rispondiamo per una prima consulenza, senza impegno.';

export const metadata = pageMetadata({ path: '/contatti', title: 'Contatti', description: DESCRIPTION });

const pad = (index: number) => String(index + 1).padStart(2, '0');

/**
 * /contatti: the last stop. Not "fill in the form": why a few lines help,
 * what happens next, and the form itself (#modulo), the same as on the home
 * (app/_contact).
 */
export default function ContactPage() {
  const contacts = contactDetails();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(contactLd(DESCRIPTION))} />
      <div className="gm-page">
        <main className="gm-inner" id="contenuto">
          <PageIntro
            crumbs={[{ name: 'Contatti' }]}
            label="Contatti"
            title={<>Raccontaci cosa vuoi <em>costruire.</em></>}
            lead={['Più comprendiamo il progetto, più possiamo capire se e come possiamo aiutarti.', 'Bastano poche righe: che attività hai, che cosa dovrebbe ottenere il sito, se hai già una scadenza in mente.']}
          />

          <section className="gm-section gm-contact-page" aria-label="Scrivici">
            <div className="gm-wrap gm-contact-grid">
              <div className="gm-contact-head" data-reveal>
                {/* The answer to "and then?", before the form is sent. */}
                <div className="gm-next-steps">
                  <h2>Cosa succede dopo</h2>
                  <ol>
                    {nextSteps.map((step, index) => <li key={step}><span aria-hidden="true">{pad(index)}</span>{step}</li>)}
                  </ol>
                  {site.responseTime && <p className="gm-next-steps-time">Ti rispondiamo entro {site.responseTime}.</p>}
                </div>
                {contacts.length > 0 && (
                  <p className="gm-contact-mail">
                    Oppure <ContactWays items={contacts} emailLead="scrivici a " or=" o " />
                  </p>
                )}
              </div>
              <div id="modulo" className="gm-contact-form" data-reveal>
                <ContactForm />
                <GrowTextarea selector="#modulo textarea" />
              </div>
            </div>
          </section>
        </main>
        <SiteFooter cta={false} />
      </div>
      <Reveal />
    </>
  );
}
