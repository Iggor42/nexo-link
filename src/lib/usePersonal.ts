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
        // Clean out any // comments just in case the JSON contains documentation comments
        const cleanText = rawText.replace(/\/\/.*$/gm, '');
        const data = JSON.parse(cleanText) as Personal;

        if (!data.slug || !data.name || !data.whatsapp) {
          throw new Error(`Dados incompletos no JSON de "${slug}"`);
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

  return { personal, loading, notFound };
}
