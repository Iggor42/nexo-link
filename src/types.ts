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
  /**
   * Quando true e o campo já tem resposta (ex.: direção escolhida no
   * hub da tela inicial), o step some da navegação — mas a resposta
   * continua no resumo e na mensagem de WhatsApp.
   */
  skipIfAnswered?: boolean;
  /**
   * Origem dinâmica das opções (type === 'single'): 'bookingSlots'
   * gera os horários livres a partir de `Tenant.booking` + da data
   * respondida em `dependsOn`. Sem ele, usa `options`.
   */
  optionsSource?: 'bookingSlots';
  /** Campo do qual este step depende (ex.: slot depende da data). Ao
   * mudar a resposta dele, a resposta deste step é descartada. */
  dependsOn?: string;
  /** Somente para type === 'date': quando false, esconde o botão
   * "Ainda sem data" (a data passa a ser obrigatória). Padrão: true. */
  allowNoDate?: boolean;
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

/**
 * Regra de mensagem de WhatsApp por direção: quando `when` casa com as
 * respostas, usa `template` (placeholders {name}, {tenant} e {field}).
 * Mensagem com template é integral: não recebe a linha de origem.
 */
export interface WhatsappTemplateRule {
  when?: { field: string; equals: string | string[] };
  template: string;
}

/**
 * Agendamento: datas ocupadas do inquilino (marcação manual, sem Google
 * Calendar) + grade de disponibilidade gerenciada pelo responsável.
 * - schedule: intervalos de atendimento por dia da semana (chaves
 *   mon..sun, horas "HH:mm"). Dia ausente ou lista vazia = fechado.
 * - blockedSlots: horários fechados pontualmente ("YYYY-MM-DDTHH:mm").
 * - slotDurationMinutes: tamanho de cada horário (padrão 30).
 * O cliente só vê os horários gerados daqui; o gestor edita estes
 * campos no JSON do tenant (sem painel próprio por enquanto).
 */
export interface TenantBooking {
  busyDates?: string[];
  slotDurationMinutes?: number;
  schedule?: Record<string, [string, string][]>;
  blockedSlots?: string[];
}

/** Acesso do hub (tela inicial com dois direcionamentos). */
export interface HeroAccess {
  /** Valor gravado no campo de direção (ex.: 'barber' | 'store'). */
  value: string;
  title: string;
  subtitle?: string;
  badge?: string;
  chips?: string[];
  icon?: 'calendar' | 'bag';
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
  /**
   * Acessos do hub: quando presente, a tela inicial vira o hub escuro
   * com um cartão por acesso (em vez do hero + botão "Começar"). Cada
   * acesso grava a direção e inicia a jornada no 1º passo.
   */
  heroAccesses?: HeroAccess[];
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
  /** Hub: logo principal da tela inicial (ex.: logo oficial do tenant). */
  heroLogo?: string;
  /** Hub: foto de fundo da tela inicial (escurecida por overlay preto). */
  heroBackground?: string;
  /** Hub: logo compacta do cabeçalho da tela inicial (fundo escuro). */
  hubHeaderLogo?: string;
  /** Segundo Instagram (ex.: loja), exibido no hub junto ao principal. */
  instagramSecondary?: string;
  /** Link "como chegar" (Google Maps) exibido no hub. */
  mapUrl?: string;
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
  /**
   * Regras de mensagem por direção (ex.: uma frase p/ barbearia e outra
   * p/ loja). A primeira regra cujo `when` casa com as respostas vence;
   * sem `when`, vale sempre. Tem prioridade sobre `whatsappTemplate`.
   * Mensagem com template não recebe a linha de origem.
   */
  whatsappTemplates?: WhatsappTemplateRule[];
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
