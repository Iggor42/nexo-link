export interface JourneyStepOption {
  id: string;
  label: string;
  description?: string;
}

export type JourneyStepType = 'single' | 'multi' | 'text' | 'phone';

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
}

export interface PersonalTheme {
  accent?: string;
  variant?: 'glass' | 'arena' | string;
  mode?: string;
  backgroundImage?: string;
}

export interface PersonalFooter {
  lines: string[];
}

export interface PersonalJourney {
  niche?: string;
  steps: JourneyStep[];
}

export interface Personal {
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
  theme?: PersonalTheme;
  backgroundImage?: string;
  socialProof?: string;
  concierge?: boolean;
  conciergeWebhook?: string;
  conciergeSecret?: string;
  journey?: PersonalJourney;
  footer?: PersonalFooter;
}

export interface LeadData {
  objetivo: string;
  experience: string;
  restrictions: string[];
  availability: string;
  modality: string;
  difficulty?: string;
  name: string;
  phone?: string;
  [key: string]: unknown;
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
