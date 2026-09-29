// gm-modulo-contatti · file comune: non modificarlo nel sito, si aggiorna con installa.mjs.
// Riceve il modulo contatti (JSON dalla pagina, o un normale invio se JavaScript
// non è partito) e lo spedisce con Resend. Variabili d'ambiente:
//   RESEND_API_KEY  chiave API di Resend
//   CONTACT_TO      chi riceve le richieste (più indirizzi separati da virgola)
//   CONTACT_FROM    mittente, es. "Sito Rossi <modulo@dominio-dello-studio.it>"; se manca,
//                   l'indirizzo di prova di Resend (consegna solo al titolare dell'account)

import config from '../../_contact/config';
import { readValues, validate } from '../../_contact/fields';

const MAX_BODY_BYTES = 32 * 1024;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX_ATTEMPTS = 5;

// Best effort: each server instance keeps its own count, so this slows a
// flood down rather than setting a hard cap. The honeypot does the rest.
const attempts = new Map<string, number[]>();

function rateLimitAllows(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((time) => time > now - RATE_WINDOW_MS);
  const allowed = recent.length < RATE_MAX_ATTEMPTS;
  if (allowed) recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 5000) {
    for (const [key, times] of attempts) if (times.every((time) => time <= now - RATE_WINDOW_MS)) attempts.delete(key);
  }
  return allowed;
}

/** JSON for the page; without JavaScript, back to the form with the outcome in the address. */
function respond(request: Request, status: number, ok: boolean, message: string, extra?: object) {
  if (!(request.headers.get('accept') ?? '').includes('application/json')) {
    const back = new URL(config.returnPath, request.url);
    back.searchParams.set('invio', ok ? 'ok' : 'errore');
    return Response.redirect(back, 303);
  }
  return Response.json({ ok, message, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === (request.headers.get('x-forwarded-host') ?? request.headers.get('host'));
  } catch {
    return false;
  }
}

async function sendEmail(key: string, to: string[], values: Record<string, string>, host: string) {
  const topic = config.fields.find((field) => field.options);
  const subject = [`Sito ${config.siteName}`, topic ? values[topic.name] : 'Nuova richiesta', values.name]
    .filter(Boolean).join(' — ').replace(/\s+/g, ' ');
  const sentAt = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date());
  const text = [
    `Nuova richiesta dal modulo contatti di ${host}`,
    '',
    ...config.fields.filter((field) => !field.multiline).map((field) => `${field.label}: ${values[field.name] || 'Non indicato'}`),
    ...config.fields.filter((field) => field.multiline).flatMap((field) => ['', `${field.label}:`, values[field.name] || 'Non indicato']),
    '',
    `Inviata il: ${sentAt} (ora italiana)`,
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM?.trim() || `Sito ${config.siteName} <onboarding@resend.dev>`,
      to,
      reply_to: values.email,
      subject,
      text,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(`Resend ha risposto ${response.status}${detail?.message ? `: ${detail.message}` : ''}`);
  }
}

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return respond(request, 413, false, 'Il messaggio è troppo grande.');
  }
  if (!sameOrigin(request)) return respond(request, 403, false, 'Origine della richiesta non consentita.');

  let raw: Record<string, unknown>;
  try {
    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) return respond(request, 413, false, 'Il messaggio è troppo grande.');
    raw = (request.headers.get('content-type') ?? '').includes('application/json')
      ? JSON.parse(body)
      : Object.fromEntries(new URLSearchParams(body));
    if (!raw || typeof raw !== 'object') throw new Error('not an object');
  } catch {
    return respond(request, 400, false, 'Richiesta non valida.');
  }

  // Bots fill the hidden field: a neutral answer, and nothing is delivered.
  if (typeof raw.website === 'string' && raw.website.trim()) return respond(request, 200, true, 'Messaggio ricevuto.');

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  if (!rateLimitAllows(ip)) {
    return respond(request, 429, false, 'Hai inviato troppi messaggi in poco tempo. Attendi qualche minuto e riprova.');
  }

  const values = readValues(raw);
  const errors = validate(values);
  if (Object.keys(errors).length) return respond(request, 422, false, 'Controlla i dati inseriti e riprova.', { errors });

  const key = process.env.RESEND_API_KEY?.trim();
  const to = (process.env.CONTACT_TO ?? '').split(',').map((address) => address.trim()).filter(Boolean);
  if (!key || !to.length) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[contact] RESEND_API_KEY o CONTACT_TO mancanti: messaggio non inviato.', values);
      return respond(request, 200, true, 'Messaggio ricevuto.', { delivered: false });
    }
    console.error('[contact] RESEND_API_KEY o CONTACT_TO non configurati.');
    return respond(request, 503, false, 'L’invio dei messaggi non è ancora attivo. Riprova più tardi.');
  }

  try {
    await sendEmail(key, to, values, new URL(request.url).host);
  } catch (error) {
    console.error('[contact] invio non riuscito:', error instanceof Error ? error.message : error);
    return respond(request, 502, false, 'Invio non riuscito. Riprova tra qualche minuto.');
  }
  return respond(request, 200, true, 'Messaggio ricevuto.');
}
