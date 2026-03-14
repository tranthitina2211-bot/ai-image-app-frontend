import { MediaItem } from '@models/media.model';

function toTime(v?: Date | string): number {
  if (!v) return 0;
  const d = (v instanceof Date) ? v : new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

export function sortMediaDesc(list: MediaItem[]): MediaItem[] {
  return [...list].sort((a, b) => {
    const ta = toTime(a.createdAt);
    const tb = toTime(b.createdAt);
    if (tb !== ta) return tb - ta;

    const oa = a.order_in_board ?? 0;
    const ob = b.order_in_board ?? 0;
    return ob - oa;
  });
}

export function toDayKey(v?: Date | string): string {
  // key = YYYY-MM-DD theo local time
  const d = (v instanceof Date) ? v : new Date(v ?? 0);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type DayGroup = { dayKey: string; items: MediaItem[] };

export function groupByDay(list: MediaItem[]): DayGroup[] {
  const map = new Map<string, MediaItem[]>();

  for (const item of list) {
    const key = toDayKey(item.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  // sort items trong từng ngày, và sort ngày desc
  const groups: DayGroup[] = [];
  for (const [dayKey, items] of map.entries()) {
    groups.push({ dayKey, items: sortMediaDesc(items) });
  }

  groups.sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1)); // YYYY-MM-DD desc
  return groups;
}
