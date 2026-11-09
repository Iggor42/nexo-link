import { z } from 'zod';
import type { UTMParams, ConciergeWebhookPayload, JourneyStep } from '../types';

export function cleanPhoneDigits(val: string): string {
  return val.replace(/\D/g, '');
}

export function formatBRPhone(val: string): string {
  const digits = cleanPhoneDigits(val).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const PhoneSchema = z.string().refine(
  (val) => {
    const digits = cleanPhoneDigits(val);
    if (digits.length < 10 || digits.length > 11) return false;
    const ddd = parseInt(digits.slice(0, 2), 10);
    return ddd >= 11 && ddd <= 99;
  },
  { message: 'Informe um WhatsApp válido com DDD (10 ou 11 dígitos).' }
);

export interface ConciergeSendResult {
  success: boolean;
  error?: string;
}

/**
 * Envia o lead ao Concierge VIA PROXY server-side (/api/lead).
 * O segredo do webhook nunca sai do servidor — o browser só fala com
 * a mesma origem. Em falha, o chamador aciona o fallback wa.me.
 */
export async function sendConciergeViaProxy(
  payload: ConciergeWebhookPayload,
  timeoutMs = 5000
): Promise<ConciergeSendResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let detail = '';
      try {
        const data = (await response.json()) as { error?: string };
        if (data?.error) detail = `: ${data.error}`;
      } catch {
        // corpo não-JSON; mantém só o status
      }
      return {
        success: false,
        error: `Proxy retornou status ${response.status}${detail}`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    clearTimeout(timer);
    const isAbort = (err as Error)?.name === 'AbortError';
    return {
      success: false,
      error: isAbort ? 'Timeout de 5s excedido' : (err as Error)?.message || 'Falha na conexão',
    };
  }
}

/** Valor sentinela da etapa de data quando o lead ainda não tem data definida. */
export const NO_DATE_VALUE = 'sem-data';

export function isISODateString(val: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(val);
}

/**
 * Formata uma data ISO (yyyy-mm-dd) da etapa de agendamento em pt-BR,
 * ex.: "sábado, 14 de novembro de 2026". Usa UTC para não deslocar o dia
 * conforme o fuso do aparelho. O sentinela vira "Ainda sem data".
 */
export function formatEventDateBR(val: string): string {
  if (val === NO_DATE_VALUE) return 'Ainda sem data';
  if (!isISODateString(val)) return val;
  const [y, m, d] = val.split('-').map((n) => parseInt(n, 10));
  const date = new Date(Date.UTC(y, m - 1, d));
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
}

/** Formatação curta pt-BR (dd/mm/aaaa) a partir de ISO, para listas/chips. */
export function formatEventDateShortBR(val: string): string {
  if (!isISODateString(val)) return val;
  const [y, m, d] = val.split('-');
  return `${d}/${m}/${y}`;
}

/** Resolve o rótulo de exibição da resposta de um step (single/multi/texto/data). */
export function getStepDisplay(
  steps: JourneyStep[],
  answers: Record<string, unknown>,
  field: string
): string {
  const step = steps.find((s) => s.field === field);
  const val = answers[field];
  if (!step || val === undefined || val === null || val === '') return '';
  if (Array.isArray(val)) {
    if (val.length === 0) return '';
    return val
      .map((v) => step.options?.find((o) => o.id === v)?.label || String(v))
      .join(', ');
  }
  if (typeof val === 'string') {
    if (step.type === 'date') return formatEventDateBR(val);
    return step.options?.find((o) => o.id === val)?.label || val;
  }
  return String(val);
}

function buildOriginLine(utms: UTMParams = {}): string {
  const source = utms.utm_source || 'direto';
  const medium = utms.utm_medium || 'organico';
  let originLine = `Via Nexo Link | Origem: ${source}/${medium}`;

  if (utms.utm_campaign) {
    originLine += ` | Campanha: ${utms.utm_campaign}`;
  }
  if (utms.utm_content) {
    originLine += ` | Conteúdo: ${utms.utm_content}`;
  }
  return originLine;
}

/**
 * Monta a mensagem de fallback wa.me a partir da jornada dinâmica.
 * Se o tenant definiu `whatsappTemplate` no JSON, usa o template com
 * placeholders {name}, {tenant} e {field}; senão, gera o resumo genérico.
 */
export function buildDynamicWhatsAppMessage(
  steps: JourneyStep[],
  answers: Record<string, unknown>,
  utms: UTMParams = {},
  template?: string,
  tenantName?: string
): string {
  const name =
    typeof answers.name === 'string' && answers.name.trim()
      ? answers.name.trim()
      : 'Cliente';
  const tenantFirst = tenantName ? tenantName.trim().split(/\s+/)[0] : '';

  let body: string;

  if (template && template.trim()) {
    body = template
      .replace(/\{tenant\}/g, tenantFirst)
      .replace(/\{name\}/g, name);
    for (const step of steps) {
      const display = getStepDisplay(steps, answers, step.field);
      body = body.replace(
        new RegExp(`\\{${step.field}\\}`, 'g'),
        display
      );
    }
    // Remove placeholders não resolvidos e normaliza espaços
    body = body
      .replace(/\{[a-zA-Z0-9_]+\}/g, '')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  } else {
    const lines: string[] = [`Olá! Meu nome é ${name}.`, '', 'Avaliação inicial:'];

    for (const step of steps) {
      if (step.field === 'name' || step.field === 'phone') continue;
      const display = getStepDisplay(steps, answers, step.field);
      if (!display) continue;
      lines.push(`${step.title}: ${display}`);
    }

    body = lines.join('\n');
  }

  return `${body}\n\n—\n${buildOriginLine(utms)}`;
}

export function buildWhatsAppUrl(whatsapp: string, message: string): string {
  const cleanPhone = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
