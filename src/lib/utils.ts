import { format, isThisYear, isToday, isYesterday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const idrCompact = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatIDR(value: number): string {
  return idr.format(value);
}

export function formatIDRCompact(value: number): string {
  return idrCompact.format(value);
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? parseISO(value) : value;
  if (isToday(d)) return 'Hari ini';
  if (isYesterday(d)) return 'Kemarin';
  if (isThisYear(d)) return format(d, 'd MMM', { locale: id });
  return format(d, 'd MMM yyyy', { locale: id });
}

export function formatDateLong(value: string | Date): string {
  const d = typeof value === 'string' ? parseISO(value) : value;
  return format(d, "EEEE, d MMMM yyyy", { locale: id });
}

export function formatTime(value: string | Date): string {
  const d = typeof value === 'string' ? parseISO(value) : value;
  return format(d, 'HH:mm');
}

export function classNames(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(' ');
}

export function parseAmountInput(raw: string): number {
  const cleaned = raw.replace(/[^\d]/g, '');
  return cleaned ? Number(cleaned) : 0;
}

export function formatAmountInput(value: number): string {
  if (!value) return '';
  return new Intl.NumberFormat('id-ID').format(value);
}
