import { useEffect, useState } from 'react';
import type { Personal } from '../types';

interface UsePersonalResult {
  personal: Personal | null;
  loading: boolean;
  notFound: boolean;
}

export function usePersonal(slug?: string): UsePersonalResult {
  const [personal, setPersonal] = useState<Personal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    async function loadPersonal() {
      try {
        const response = await fetch(`/personals/${slug}.json`);
        const contentType = response.headers.get('content-type') || '';
        
        if (!response.ok || contentType.includes('text/html')) {
          if (isMounted) {
            console.warn(`[usePersonal] Personal "${slug}" não encontrado (status: ${response.status}, content-type: ${contentType}). Renderizando NotFoundPersonal.`);
            setNotFound(true);
            setPersonal(null);
            setLoading(false);
          }
          return;
        }

        const rawText = await response.text();
        // Parse directly or strip comments if present without destroying URLs (e.g. https://)
        let data: Personal;
        try {
          data = JSON.parse(rawText) as Personal;
        } catch {
          // Only if standard JSON.parse fails, strip single line comments that start at line beginning or after whitespace
          const cleanText = rawText.replace(/^\s*\/\/.*$/gm, '');
          data = JSON.parse(cleanText) as Personal;
        }

        if (!data.slug || !data.name || !data.whatsapp) {
          throw new Error(`Dados incompletos no JSON de "${slug}"`);
        }

        // Variáveis de ambiente de preview têm prioridade caso webhook ou secret estejam vazios ou ausentes
        const envWebhook = (import.meta.env.VITE_CONCIERGE_WEBHOOK as string | undefined)?.trim();
        const envSecret = (import.meta.env.VITE_CONCIERGE_SECRET as string | undefined)?.trim();

        if (data.concierge) {
          if (!data.conciergeWebhook && envWebhook) {
            data.conciergeWebhook = envWebhook;
          }
          if (!data.conciergeSecret && envSecret) {
            data.conciergeSecret = envSecret;
          }
        }

        if (isMounted) {
          setPersonal(data);
          setNotFound(false);
          setLoading(false);
        }
      } catch (err) {
        console.error(`[usePersonal] Erro ao carregar dados do personal "${slug}":`, err);
        if (isMounted) {
          setNotFound(true);
          setPersonal(null);
          setLoading(false);
        }
      }
    }

    loadPersonal();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Atualização dinâmica de título e meta tags para SEO e compartilhamento social
  useEffect(() => {
    if (!personal) {
      if (notFound) {
        document.title = 'Nexo Link · Profissional não encontrado';
      }
      return;
    }

    const pageTitle = [personal.name, personal.profession || personal.tagline].filter(Boolean).join(' · ');
    const pageDescription =
      personal.tagline ||
      personal.profession ||
      'Link de bio conversível com jornada guiada e contato qualificado via WhatsApp.';
    const pagePhoto = personal.photo;

    document.title = pageTitle;

    const setMetaTag = (attrName: 'name' | 'property', attrVal: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('name', 'description', pageDescription);
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDescription);
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDescription);

    if (pagePhoto) {
      const fullPhotoUrl = pagePhoto.startsWith('http')
        ? pagePhoto
        : `${window.location.origin}${pagePhoto}`;
      setMetaTag('property', 'og:image', fullPhotoUrl);
      setMetaTag('name', 'twitter:image', fullPhotoUrl);
    }
  }, [personal, notFound]);

  return { personal, loading, notFound };
}
