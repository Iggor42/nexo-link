import type { UTMParams } from '../types';

export function captureUTMs(search: string = ''): UTMParams {
  if (typeof window === 'undefined') {
    return {
      utm_source: 'direto',
      utm_medium: 'organico',
    };
  }

  const query = search || window.location.search;
  const params = new URLSearchParams(query);

  const utm_source = params.get('utm_source') || undefined;
  const utm_medium = params.get('utm_medium') || undefined;
  const utm_campaign = params.get('utm_campaign') || undefined;
  const utm_content = params.get('utm_content') || undefined;
  const referrer = document.referrer ? document.referrer : undefined;

  return {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    referrer,
  };
}
