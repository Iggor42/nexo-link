import { z } from 'zod';
import {
  OBJETIVO_OPTIONS,
  EXPERIENCE_OPTIONS,
  RESTRICTIONS_OPTIONS,
  AVAILABILITY_OPTIONS,
  MODALITY_OPTIONS,
  getLabel,
  getMultipleLabels,
} from '../config/questions';
import type { LeadData, UTMParams, ConciergeWebhookPayload } from '../types';

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

export const LeadSchema = z.object({
  objetivo: z.string().min(1, 'Selecione um objetivo'),
  experience: z.string().min(1, 'Selecione seu nível atual'),
  restrictions: z.array(z.string()).min(1, 'Selecione ao menos uma opção'),
  availability: z.string().min(1, 'Selecione a frequência semanal'),
  modality: z.string().min(1, 'Selecione a modalidade de treino'),
  difficulty: z.string().optional(),
  name: z.string().trim().min(2, 'O nome deve conter pelo menos 2 caracteres'),
  phone: z.string().optional(),
});

export interface ConciergeSendResult {
  success: boolean;
  error?: string;
}

export async function sendConciergeWebhook(
  webhookUrl: string,
  secret: string | undefined,
  payload: ConciergeWebhookPayload,
  timeoutMs = 5000
): Promise<ConciergeSendResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (secret) {
      headers['x-nexo-secret'] = secret;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        success: false,
        error: `Servidor retornou status ${response.status}`,
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

export function buildWhatsAppMessage(lead: LeadData, utms: UTMParams = {}): string {
  const name = lead.name.trim();
  const objetivoLabel = getLabel(OBJETIVO_OPTIONS, lead.objetivo);
  const experienceLabel = getLabel(EXPERIENCE_OPTIONS, lead.experience);
  const restrictionsLabel = getMultipleLabels(RESTRICTIONS_OPTIONS, lead.restrictions);
  const availabilityLabel = getLabel(AVAILABILITY_OPTIONS, lead.availability);
  const modalityLabel = getLabel(MODALITY_OPTIONS, lead.modality);
  const difficulty = lead.difficulty ? lead.difficulty.trim() : '';

  const source = utms.utm_source || 'direto';
  const medium = utms.utm_medium || 'organico';
  let originLine = `Via Nexo Link | Origem: ${source}/${medium}`;

  if (utms.utm_campaign) {
    originLine += ` | Campanha: ${utms.utm_campaign}`;
  }
  if (utms.utm_content) {
    originLine += ` | Conteúdo: ${utms.utm_content}`;
  }

  const lines: string[] = [
    `Olá! Meu nome é ${name}.`,
    '',
    'Quero começar a treinar — avaliação inicial:',
    `Objetivo: ${objetivoLabel}`,
    `Nível hoje: ${experienceLabel}`,
    `Limitações: ${restrictionsLabel}`,
    `Rotina: ${availabilityLabel} · ${modalityLabel}`,
  ];

  if (difficulty.length > 0) {
    lines.push(`Maior dificuldade: ${difficulty}`);
  }

  lines.push('');
  lines.push('—');
  lines.push(originLine);

  return lines.join('\n');
}

export function buildDynamicWhatsAppMessage(
  steps: import('../types').JourneyStep[],
  answers: Record<string, unknown>,
  utms: UTMParams = {},
  niche?: string,
  personalName?: string
): string {
  if (niche === 'eventos') {
    const getFieldDisplay = (field: string): string => {
      const step = steps.find((s) => s.field === field);
      const val = answers[field];
      if (!step || val === undefined || val === null || val === '') return '';
      if (Array.isArray(val)) {
        if (val.length === 0) return 'Nenhum';
        return val
          .map((v) => step.options?.find((o) => o.id === v)?.label || String(v))
          .join(', ');
      }
      return step.options?.find((o) => o.id === val)?.label || String(val);
    };

    const name = typeof answers.name === 'string' && answers.name.trim() ? answers.name.trim() : 'Cliente';
    const goal = getFieldDisplay('goal') || 'Geral';
    const availability = getFieldDisplay('availability') || 'A combinar';
    const experience = getFieldDisplay('experience') || 'Sob consulta';
    const modality = getFieldDisplay('modality') || 'Personalizado';
    const restrictions = getFieldDisplay('restrictions') || 'Nenhum';
    const difficulty = getFieldDisplay('difficulty') || 'Orçamento geral';
    const firstName = personalName ? personalName.trim().split(/\s+/)[0] : 'Caio';

    return `Ola, ${firstName}! Sou ${name}. Montei meu pedido pelo link: evento ${goal}, ${availability}, cerca de ${experience} convidados, estilo ${modality}. Pedidos especiais: ${restrictions}. Maior dificuldade: ${difficulty}. Pode me passar um orcamento?`;
  }

  const name = typeof answers.name === 'string' && answers.name.trim() ? answers.name.trim() : 'Aluno';
  const source = utms.utm_source || 'direto';
  const medium = utms.utm_medium || 'organico';
  let originLine = `Via Nexo Link | Origem: ${source}/${medium}`;

  if (utms.utm_campaign) {
    originLine += ` | Campanha: ${utms.utm_campaign}`;
  }
  if (utms.utm_content) {
    originLine += ` | Conteúdo: ${utms.utm_content}`;
  }

  const lines: string[] = [
    `Olá! Meu nome é ${name}.`,
    '',
    'Avaliação inicial:',
  ];

  for (const step of steps) {
    if (step.field === 'name' || step.field === 'phone') continue;
    const rawVal = answers[step.field];
    if (rawVal === undefined || rawVal === null || rawVal === '') continue;

    if (Array.isArray(rawVal)) {
      if (rawVal.length === 0) continue;
      const labels = rawVal.map((v) => {
        const match = step.options?.find((o) => o.id === v);
        return match ? match.label : String(v);
      });
      lines.push(`${step.title}: ${labels.join(', ')}`);
    } else if (typeof rawVal === 'string') {
      const match = step.options?.find((o) => o.id === rawVal);
      const label = match ? match.label : rawVal;
      lines.push(`${step.title}: ${label}`);
    }
  }

  lines.push('');
  lines.push('—');
  lines.push(originLine);

  return lines.join('\n');
}

export function buildWhatsAppUrl(whatsapp: string, message: string): string {
  const cleanPhone = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
