import { validateContact, type ContactValues } from '../../contact-validation';

// Delivery: set CONTACT_WEBHOOK_URL (Formspree, Make, Zapier, Slack…) in the
// deployment environment. Each message is POSTed there as JSON.
export async function POST(request: Request) {
  let body: Partial<ContactValues> & { website?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const values: ContactValues = {
    name: String(body.name ?? '').slice(0, 200),
    email: String(body.email ?? '').slice(0, 200),
    company: String(body.company ?? '').slice(0, 200),
    idea: String(body.idea ?? '').slice(0, 5000),
  };
  // Bots fill the hidden field: accept silently, deliver nothing.
  if (body.website) return Response.json({ ok: true });
  const errors = validateContact(values);
  if (Object.keys(errors).length) return Response.json({ ok: false, errors }, { status: 422 });

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[contact] CONTACT_WEBHOOK_URL not set; message not delivered:', values);
      return Response.json({ ok: true, delivered: false });
    }
    console.error('[contact] CONTACT_WEBHOOK_URL is not configured.');
    return Response.json({ ok: false }, { status: 503 });
  }
  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...values, source: 'Sito GoMore', receivedAt: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`Webhook responded ${response.status}`);
  } catch (error) {
    console.error('[contact] delivery failed:', error);
    return Response.json({ ok: false }, { status: 502 });
  }
  return Response.json({ ok: true });
}
