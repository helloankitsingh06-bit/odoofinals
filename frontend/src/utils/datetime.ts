// Centralised date/time formatting for PeoplePay360.
//
// ISSUE 2: timestamps are stored in the DB in UTC (correct practice). The bug was
// that the UI rendered them with `new Date(x).toISOString()`, which always prints
// UTC — so an employee created at 21:00 IST showed "15:28". Everything user-facing
// must be rendered in the user's local timezone. We pin to Asia/Kolkata (IST) so
// the display is correct regardless of where the browser/server actually runs.

const IST = 'Asia/Kolkata';
const LOCALE = 'en-IN';

/** Full date + time in IST, e.g. "05/09/2026, 9:00:12 pm". For createdAt/updatedAt, activity logs. */
export function formatDateTimeIST(value?: string | number | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(LOCALE, {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/** Date only in IST, e.g. "05/09/2026". For contract dates, payslip periods, time-off ranges. */
export function formatDateIST(value?: string | number | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(LOCALE, {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/** Time only in IST, e.g. "09:00 am". For attendance check-in / check-out. */
export function formatTimeIST(value?: string | number | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(LOCALE, {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * `YYYY-MM-DD` for the given instant *as seen in IST* — for <input type="date">
 * default values and edit prefills, so the picker shows the local calendar date
 * rather than the UTC one.
 */
export function toISTDateInputValue(value?: string | number | Date | null): string {
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) return '';
  // en-CA renders ISO-style YYYY-MM-DD; apply the IST timezone offset.
  return d.toLocaleDateString('en-CA', { timeZone: IST });
}

/** `YYYY-MM-DDTHH:mm` in IST — for <input type="datetime-local"> default values. */
export function toISTDateTimeInputValue(value?: string | number | Date | null): string {
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}
