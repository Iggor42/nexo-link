import { useEffect, useState } from 'react';
import type { Tenant } from '../types';

interface UseTenantResult {
  tenant: Tenant | null;
  loading: boolean;
  notFound: boolean;
}

export function useTenant(slug?: string): UseTenantResult {
  const [tenant, setTenant] = useState<Tenant | null>(null);
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

    async function loadTenant() {
      try {
        const response = await fetch(`/tenants/${slug}.json`);
        const contentType = response.headers.get('content-type') || '';
        
        if (!response.ok || contentType.includes('text/html')) {
          if (isMounted) {
            console.warn(`[useTenant] Tenant "${slug}" não encontrado (status: ${response.status}, content-type: ${contentType}). Renderizando NotFoundTenant.`);
            setNotFound(true);
            setTenant(null);
            setLoading(false);
          }
          return;
        }

        const rawText = await response.text();
        // Parse directly or strip comments if present without destroying URLs (e.g. https://)
        let data: Tenant;
        try {
          data = JSON.parse(rawText) as Tenant;
        } catch {
          // Only if standard JSON.parse fails, strip single line comments that start at line beginning or after whitespace
          const cleanText = rawText.replace(/^\s*\/\/.*$/gm, '');
          data = JSON.parse(cleanText) as Tenant;
        }

        if (!data.slug || !data.name || !data.whatsapp) {
          throw new Error(`Dados incompletos no JSON de "${slug}"`);
        }

        // O webhook do Concierge é resolvido server-side (api/lead.ts); o browser
        // nunca recebe URL nem segredo. `conciergeWebhook` no JSON serve só
        // como flag de que o modo concierge está disponível para o tenant.

        if (isMounted) {
          setTenant(data);
          setNotFound(false);
          setLoading(false);
        }
      } catch (err) {
        console.error(`[useTenant] Erro ao carregar dados do tenant "${slug}":`, err);
        if (isMounted) {
          setNotFound(true);
          setTenant(null);
          setLoading(false);
        }
      }
    }

    loadTenant();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Atualização dinâmica de título e meta tags para SEO e compartilhamento social
  useEffect(() => {
    if (!tenant) {
      if (notFound) {
        document.title = 'Nexo Link · Profissional não encontrado';
      }
      return;
    }

    const pageTitle = [tenant.name, tenant.profession || tenant.tagline].filter(Boolean).join(' · ');
    const pageDescription =
      tenant.tagline ||
      tenant.profession ||
      'Link de bio conversível com jornada guiada e contato qualificado via WhatsApp.';
    const pagePhoto = tenant.photo;

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
  }, [tenant, notFound]);

  return { tenant, loading, notFound };
}
