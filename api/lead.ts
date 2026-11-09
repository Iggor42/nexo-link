/**
 * POST /api/lead — proxy server-side do Concierge.
 *
 * Motivo: o segredo do webhook NUNCA pode ir para o browser. O frontend
 * envia o lead para cá; esta função guarda o segredo (env server-side)
 * e repassa ao webhook do Concierge com o header x-nexo-secret.
 *
 * Body esperado:
 *   { personalSlug, lead: { name, phone, ...respostas }, utms? }
 *
 * Env vars (Vercel → Environment Variables, NUNCA com prefixo VITE_):
 *   CONCIERGE_SECRET      — segredo do header x-nexo-secret
 *   CONCIERGE_WEBHOOK_URL — override opcional do webhook (ex.: preview);
 *                           se vazio, usa o conciergeWebhook do JSON do tenant
 *
 * Nota: os JSONs de tenant precisam estar disponíveis em runtime.
 * vercel.json → functions["api/lead.ts"].includeFiles cobre isso.
 */
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

/* ------------------------------------------------------------------ */
/* Tipos mínimos compatíveis com o runtime da Vercel (sem @vercel/node) */
/* ------------------------------------------------------------------ */
interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
interface VercelResponse {
  status(code: number): VercelResponse;
  json(payload: unknown): void;
}

/* ------------------------------------------------------------------ */
/* Validação                                                         */
/* ------------------------------------------------------------------ */
const SlugSchema = z.string().regex(/^[a-z0-9-]{2,40}$/);

const LeadSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(24),
  })
  .catchall(z.unknown());

const BodySchema = z.object({
  personalSlug: SlugSchema,
  lead: LeadSchema,
  utms: z
    .object({
      utm_source: z.string().max(120).optional(),
      utm_medium: z.string().max(120).optional(),
      utm_campaign: z.string().max(120).optional(),
      utm_content: z.string().max(120).optional(),
      referrer: z.string().max(300).optional(),
    })
    .optional()
    .default({}),
});

function cleanPhoneDigits(val: string): string {
  return val.replace(/\D/g, '');
}

function isValidBRPhone(val: string): boolean {
  const digits = cleanPhoneDigits(val);
  if (digits.length < 10 || digits.length > 11) return false;
  const ddd = parseInt(digits.slice(0, 2), 10);
  return ddd >= 11 && ddd <= 99;
}

/** Sanitiza as respostas dinâmicas: só primitivas, com tetos de tamanho. */
function sanitizeAnswers(lead: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(lead)) {
    if (!/^[a-zA-Z0-9_]{1,40}$/.test(key)) continue;
    if (typeof val === 'string') {
      out[key] = val.slice(0, 500);
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      out[key] = val;
    } else if (Array.isArray(val)) {
      out[key] = val
        .filter((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
        .map((v) => (typeof v === 'string' ? v.slice(0, 120) : v))
        .slice(0, 20);
    }
    // objetos aninhados são descartados (não fazem parte do contrato do lead)
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Rate limit simples por IP (por instância; primeira camada de defesa) */
/* ------------------------------------------------------------------ */
const hits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requisições
const RATE_WINDOW_MS = 60_000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function clientIp(req: VercelRequest): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  if (Array.isArray(xff) && xff[0]) return xff[0].split(',')[0].trim();
  return 'unknown';
}

/* ------------------------------------------------------------------ */
/* Tenant (lido server-side; NUNCA confiado no que o client afirma)    */
/* ------------------------------------------------------------------ */
function loadTenantWebhook(slug: string): string | null {
  const tenantsDir = resolve(join(process.cwd(), 'public', 'tenants'));
  const filePath = resolve(join(tenantsDir, `${slug}.json`));
  // Defesa contra path traversal (o regex do slug já barra, mas belt & braces)
  if (!filePath.startsWith(tenantsDir + sep)) return null;

  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  let data: { conciergeWebhook?: unknown };
  try {
    data = JSON.parse(raw) as { conciergeWebhook?: unknown };
  } catch {
    const clean = raw.replace(/^\s*\/\/.*$/gm, '');
    try {
      data = JSON.parse(clean) as { conciergeWebhook?: unknown };
    } catch {
      return null;
    }
  }

  const fromJson = typeof data.conciergeWebhook === 'string' ? data.conciergeWebhook.trim() : '';
  if (fromJson) return fromJson;

  const override = (process.env.CONCIERGE_WEBHOOK_URL || '').trim();
  return override || null;
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  }

  if (rateLimited(clientIp(req))) {
    return res.status(429).json({ ok: false, error: 'muitas tentativas, aguarde um minuto' });
  }

  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'payload inválido' });
  }

  const { personalSlug, lead, utms } = parsed.data;

  if (!isValidBRPhone(lead.phone)) {
    return res.status(400).json({ ok: false, error: 'whatsapp inválido' });
  }

  const webhookUrl = loadTenantWebhook(personalSlug);
  if (!webhookUrl) {
    return res.status(503).json({ ok: false, error: 'concierge não configurado para este tenant' });
  }

  const secret = (process.env.CONCIERGE_SECRET || '').trim();

  const payload = {
    personalSlug,
    lead: {
      ...sanitizeAnswers(lead as Record<string, unknown>),
      phone: cleanPhoneDigits(lead.phone),
    },
    utms,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['x-nexo-secret'] = secret;

    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!upstream.ok) {
      console.error(`[api/lead] upstream ${upstream.status} slug=${personalSlug}`);
      return res.status(502).json({ ok: false, error: 'falha no concierge' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    clearTimeout(timer);
    const isAbort = (err as Error)?.name === 'AbortError';
    console.error(`[api/lead] erro slug=${personalSlug} timeout=${isAbort}`);
    return res.status(502).json({ ok: false, error: 'falha no concierge' });
  }
}
