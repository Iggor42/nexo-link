export interface Personal {
  slug: string;
  name: string;
  cref: string;
  tagline: string;
  specialties: string[];
  whatsapp: string;
  instagram: string;
  photo: string;
  accent: string;
  socialProof: string;
}

export interface LeadData {
  objetivo: string;
  experience: string;
  restrictions: string[];
  availability: string;
  modality: string;
  difficulty?: string;
  name: string;
}

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
}
