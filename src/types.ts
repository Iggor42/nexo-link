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
   * Somente para type === 'date': datas ocupadas (ISO yyyy-mm-dd) desta
   * etapa. É somado às datas de `Tenant.booking.busyDates`.
   */
  busyDates?: string[];
}

/** Agendamento: datas ocupadas do inquilino (marcação manual, sem Google Calendar). */
export interface TenantBooking {
  busyDates?: string[];
}

/** Servico da tabela da barbearia (tenant variant === 'barber'). */
export interface BarberService {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  popular?: boolean;
  badge?: string;
  description?: string;
}

/** Categoria da loja masculina (tenant variant === 'barber'). */
export interface StoreCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
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
  /** Barbearia | Loja Masculina (variant === 'barber'): dois direcionamentos. */
  address?: string;
  neighborhood?: string;
  phoneFormatted?: string;
  instagramSecondary?: string;
  mapUrl?: string;
  twoDirections?: boolean;
  barberServices?: BarberService[];
  storeCategories?: StoreCategory[];
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
