export interface JourneyStepOption {
  id: string;
  label: string;
  description?: string;
}

export type JourneyStepType = 'single' | 'multi' | 'text' | 'phone' | 'date';

export interface JourneyStep {
  id: string;
  type: JourneyStepType;
  title: string;
  subtitle?: string;
  field: string;
  options?: JourneyStepOption[];
  placeholder?: string;
  required?: boolean;
  minChars?: number;
  /**
   * Condicional: o step só aparece quando a resposta de `field` for
   * igual a `equals` (ou estiver na lista). Sem `when`, sempre visível.
   * Ex.: serviços da barbearia só quando direction === 'barber'.
   */
  when?: { field: string; equals: string | string[] };
  /** Somente para type === 'date': rótulo acima do input (padrão: "Data do evento"). */
  dateLabel?: string;
  /** Texto do botão quando este é o último step (padrão: "Concluir avaliação"). */
  lastStepCta?: string;
  /**
   * Somente para type === 'date': datas ocupadas (ISO yyyy-mm-dd) desta
   * etapa. É somado às datas de `Tenant.booking.busyDates`.
   */
  busyDates?: string[];
}

/** Agendamento: datas ocupadas do inquilino (marcação manual, sem Google Calendar). */
export interface TenantBooking {
  busyDates?: string[];
}

/** Sinal via Pix exibido na tela final. Sem gateway: só chave + valor p/ copiar. */
export interface TenantPix {
  key: string;
  amount?: number;
  label?: string;
}

/** Depoimento de prova social (carrossel na tela inicial). */
export interface Testimonial {
  name: string;
  eventType: string;
  city: string;
  quote: string;
}

export interface TenantTheme {
  accent?: string;
  variant?: 'glass' | 'arena' | string;
  mode?: string;
  backgroundImage?: string;
}

export interface TenantFooter {
  lines: string[];
}

export interface TenantJourney {
  niche?: string;
  /**
   * Nº de passos exibido no hero ("N passos rápidos"). Sem ele, usa o
   * total de steps da jornada. Útil em jornadas condicionais, onde o
   * total varia conforme a direção escolhida (ex.: Akis: 7 na barbearia).
   */
  heroSteps?: number;
  steps: JourneyStep[];
}

export interface Tenant {
  slug: string;
  name: string;
  profession?: string;
  city?: string;
  since?: number;
  cref?: string;
  tagline?: string;
  specialties?: string[];
  /** Texto do botão principal do hero (padrão: conforme o nicho). */
  heroCta?: string;
  whatsapp: string;
  instagram?: string;
  photo: string;
  accent?: string;
  theme?: TenantTheme;
  backgroundImage?: string;
  socialProof?: string;
  concierge?: boolean;
  conciergeWebhook?: string;
  journey?: TenantJourney;
  /** Agendamento: quando presente, alimenta as etapas type === 'date'. */
  booking?: TenantBooking;
  /** Sinal via Pix: bloco na tela final só aparece se `pix.key` estiver preenchida. */
  pix?: TenantPix;
  /** Prova social: carrossel só aparece se o array tiver itens. */
  testimonials?: Testimonial[];
  footer?: TenantFooter;
  /**
   * Template da mensagem de fallback wa.me. Placeholders:
   * {name} = nome do lead, {tenant} = primeiro nome do tenant,
   * {field} = rótulo da resposta de cada step da jornada.
   * Se ausente, usa o resumo genérico por steps.
   */
  whatsappTemplate?: string;
}

export interface ConciergeWebhookPayload {
  personalSlug: string;
  lead: {
    name?: string;
    phone?: string;
    goal?: string;
    experience?: string;
    restrictions?: string[];
    availability?: string;
    modality?: string;
    difficulty?: string;
    [key: string]: unknown;
  };
  utms: UTMParams;
}

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
}
