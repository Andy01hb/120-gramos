import type { StandSettings, DaySchedule } from '../types';

// Río Bravo, Tamaulipas → zona horaria centro de México.
export const STAND_TZ = 'America/Monterrey';

export const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DAY_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const WD_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DEFAULT_CLOSED_MESSAGE = 'El stand está cerrado por ahora.';

/** A sensible starting weekly schedule (index 0 = Sunday). */
export function defaultSchedule(): DaySchedule[] {
  return Array.from({ length: 7 }, (_, i) => ({
    // Fri/Sat/Sun open by default, rest closed — ajustable por el admin.
    closed: !(i === 0 || i === 5 || i === 6),
    open: '16:00',
    close: '22:00',
  }));
}

/** Current weekday (0-6) and minutes-of-day in the stand timezone. */
function nowInTz(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: STAND_TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const wd = parts.find(p => p.type === 'weekday')?.value ?? 'Sun';
  const hour = (parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10)) % 24;
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
  return { day: Math.max(0, WD_KEYS.indexOf(wd)), minutes: hour * 60 + minute };
}

/** Current weekday index (0=Sunday) in the stand timezone. */
export function getStandDayIndex(now: Date = new Date()): number {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: STAND_TZ, weekday: 'short' }).format(now);
  return Math.max(0, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd));
}

function toMinutes(hhmm: string): number {
  const [h, m] = (hhmm ?? '').split(':').map(n => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

/** Computes whether the stand is open right now from its settings. */
export function isStandOpenNow(settings: StandSettings | null, now: Date = new Date()): boolean {
  // No settings yet → default open (preserves previous behavior).
  if (!settings) return true;

  if (settings.mode !== 'auto') return settings.isOpen ?? true;

  if (settings.forceClosed) return false;

  const sched = settings.schedule;
  if (!sched || sched.length !== 7) return false;

  const { day, minutes } = nowInTz(now);
  const today = sched[day];
  if (!today || today.closed) return false;

  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  if (Number.isNaN(open) || Number.isNaN(close)) return false;

  return minutes >= open && minutes < close;
}

function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

/**
 * Short summary of the open days for a footer, e.g. "Vie, Sáb y Dom · Desde 5:00 PM".
 * Returns '' if there's no schedule (caller can fall back to a default).
 */
export function scheduleSummary(settings: StandSettings | null): string {
  const sched = settings?.schedule;
  if (!sched || sched.length !== 7) return '';

  const order = [1, 2, 3, 4, 5, 6, 0]; // Lun→Dom
  const openIdx = order.filter(di => !sched[di].closed);
  if (openIdx.length === 0) return 'Cerrado temporalmente';

  const names = openIdx.map(di => DAY_SHORT_ES[di]);
  const days = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;

  const openTimes = new Set(openIdx.map(di => sched[di].open));
  if (openTimes.size === 1) return `${days} · Desde ${fmt12(sched[openIdx[0]].open)}`;
  return days;
}

/** Human-readable today's hours, e.g. "16:00–22:00" or "Cerrado". */
export function todayHoursLabel(settings: StandSettings | null, now: Date = new Date()): string {
  const sched = settings?.schedule;
  if (!sched || sched.length !== 7) return '';
  const { day } = nowInTz(now);
  const d = sched[day];
  if (!d || d.closed) return 'Cerrado hoy';
  return `Hoy: ${d.open}–${d.close}`;
}
