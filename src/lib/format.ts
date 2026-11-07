/** Date, money and greeting helpers. All dates are shown in the clinic's time zone. */

type Parts = { weekday: string; weekdayShort: string; day: number; month: string; monthShort: string; year: number; hour: number; minute: number };

export function partsInZone(iso: string | Date, timeZone: string): Parts {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(d)) p[part.type] = part.value;
  return {
    weekday: p.weekday,
    weekdayShort: p.weekday.slice(0, 3),
    day: Number(p.day),
    month: p.month,
    monthShort: p.month.slice(0, 3),
    year: Number(p.year),
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
  };
}

export function formatTime(iso: string, timeZone: string): string {
  const { hour, minute } = partsInZone(iso, timeZone);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** "Thu, 22 Oct 2026" */
export function formatDate(iso: string, timeZone: string): string {
  const p = partsInZone(iso, timeZone);
  return `${p.weekdayShort}, ${p.day} ${p.monthShort} ${p.year}`;
}

/** "22 Oct 2026" */
export function formatDateShort(iso: string, timeZone: string): string {
  const p = partsInZone(iso, timeZone);
  return `${p.day} ${p.monthShort} ${p.year}`;
}

/** "Oct 22" */
export function formatMonthDay(iso: string, timeZone: string): string {
  const p = partsInZone(iso, timeZone);
  return `${p.monthShort} ${p.day}`;
}

/** "Thursday, 22 October" */
export function formatLongToday(now: Date, timeZone: string): string {
  const p = partsInZone(now, timeZone);
  return `${p.weekday}, ${p.day} ${p.month}`;
}

export function greeting(now: Date, timeZone: string): string {
  const { hour } = partsInZone(now, timeZone);
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const dayKey = (iso: string | Date, timeZone: string) => {
  const p = partsInZone(iso, timeZone);
  return Date.UTC(p.year, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(p.month), p.day);
};

export function isSameClinicDay(a: string | Date, b: string | Date, timeZone: string): boolean {
  return dayKey(a, timeZone) === dayKey(b, timeZone);
}

/** "today", "tomorrow", "in 5 days", "in 2 weeks" — calendar days in the clinic zone. */
export function relativeDays(iso: string, now: Date, timeZone: string): string {
  const days = Math.round((dayKey(iso, timeZone) - dayKey(now, timeZone)) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 0) return days === -1 ? 'yesterday' : `${-days} days ago`;
  if (days < 14) return `in ${days} days`;
  return `in ${Math.round(days / 7)} weeks`;
}

/** "Oct 22" for older days, "10:42 AM" for today. */
export function formatMessageTime(iso: string, now: Date, timeZone: string): string {
  return isSameClinicDay(iso, now, timeZone) ? formatTime(iso, timeZone) : formatMonthDay(iso, timeZone);
}

/** "₱1,500.00"; negative amounts use a true minus sign: "−₱200.00". */
export function money(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${amount < 0 ? '−' : ''}₱${abs}`;
}

/** "₱500" for prices that are whole pesos. */
export function price(amount: number): string {
  return Number.isInteger(amount) ? `₱${amount.toLocaleString('en-US')}` : money(amount);
}

/** "05/14/1978", "5/14/1978" or "1978-05-14" → "1978-05-14"; null when it is not a real date. */
export function isoBirthDate(input: string): string | null {
  const s = input.trim();
  let y: number, m: number, d: number;
  const us = /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/.exec(s);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (us) [m, d, y] = [Number(us[1]), Number(us[2]), Number(us[3])];
  else if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
