import type { TenantBooking } from '../types';
import { isISODateString } from './lead';

/** Chaves de dia da semana no `TenantBooking.schedule` (mon..sun). */
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const WEEKDAY_LABELS_PT: Record<string, string> = {
  mon: 'segunda',
  tue: 'terça',
  wed: 'quarta',
  thu: 'quinta',
  fri: 'sexta',
  sat: 'sábado',
  sun: 'domingo',
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Dia da semana local (sem deslocar o dia por fuso, como o input date). */
function weekdayKey(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  return WEEKDAY_KEYS[date.getDay()];
}

/**
 * Gera os horários livres de um dia a partir da grade do gestor.
 * Regras: dia fora da grade ou em `busyDates` = sem horários; horários
 * em `blockedSlots` são removidos; no dia de hoje, horários passados
 * (com 15 min de folga) não aparecem. Retorna ["HH:mm", ...].
 */
export function getAvailableSlots(
  booking: TenantBooking | undefined,
  dateISO: string,
  now: Date = new Date()
): string[] {
  if (!booking || !isISODateString(dateISO)) return [];
  if ((booking.busyDates || []).includes(dateISO)) return [];

  const intervals = booking.schedule?.[weekdayKey(dateISO)] || [];
  if (intervals.length === 0) return [];

  const duration = booking.slotDurationMinutes && booking.slotDurationMinutes > 0
    ? booking.slotDurationMinutes
    : 30;
  const blocked = new Set(booking.blockedSlots || []);

  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = dateISO === todayISO;
  const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + 15 : -1;

  const slots: string[] = [];
  for (const [start, end] of intervals) {
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    if (Number.isNaN(startMin) || Number.isNaN(endMin) || endMin <= startMin) continue;
    for (let t = startMin; t + duration <= endMin; t += duration) {
      const label = toHHMM(t);
      if (isToday && t < nowMinutes) continue;
      if (blocked.has(`${dateISO}T${label}`)) continue;
      slots.push(label);
    }
  }
  return slots;
}

/**
 * Resumo legível da grade p/ exibir na etapa de data, ex.:
 * "Segunda a sábado · 09h–20h" ou "Segunda, quarta e sexta · 09h–12h".
 * Retorna '' quando não há grade configurada.
 */
export function scheduleSummary(booking: TenantBooking | undefined): string {
  if (!booking?.schedule) return '';
  const days = (Object.keys(WEEKDAY_LABELS_PT) as string[]).filter(
    (k) => (booking.schedule?.[k] || []).length > 0
  );
  if (days.length === 0) return '';

  const ranges = new Set<string>();
  const fmtHour = (t: string) => (t.endsWith(':00') ? `${t.slice(0, 2)}h` : t.replace(':', 'h'));
  for (const k of days) {
    for (const [s, e] of booking.schedule[k]) {
      ranges.add(`${fmtHour(s)}–${fmtHour(e)}`);
    }
  }
  const hours = [...ranges].join(' e ');

  const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const sorted = [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const consecutive =
    sorted.length > 1 &&
    sorted.every((k, i) => i === 0 || order.indexOf(k) === order.indexOf(sorted[i - 1]) + 1);
  const dayLabel = consecutive
    ? `${WEEKDAY_LABELS_PT[sorted[0]]} a ${WEEKDAY_LABELS_PT[sorted[sorted.length - 1]]}`
    : sorted.map((k) => WEEKDAY_LABELS_PT[k]).join(', ');
  const capitalized = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
  return `${capitalized} · ${hours}`;
}
