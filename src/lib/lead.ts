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
import type { LeadData, UTMParams } from '../types';

export const LeadSchema = z.object({
  objetivo: z.string().min(1, 'Selecione um objetivo'),
  experience: z.string().min(1, 'Selecione seu nível atual'),
  restrictions: z.array(z.string()).min(1, 'Selecione ao menos uma opção'),
  availability: z.string().min(1, 'Selecione a frequência semanal'),
  modality: z.string().min(1, 'Selecione a modalidade de treino'),
  difficulty: z.string().optional(),
  name: z.string().trim().min(2, 'O nome deve conter pelo menos 2 caracteres'),
});

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

export function buildWhatsAppUrl(whatsapp: string, message: string): string {
  const cleanPhone = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
