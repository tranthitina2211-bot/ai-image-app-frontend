import { MediaItem } from '@models/media.model';

export type DayGroup = { dayKey: string; items: MediaItem[] };

function toTime(v?: Date | string): number {
  if (!v) return 0;
  const d = v instanceof Date ? v : new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

function toDayKey(v?: Date | string): string {
  const d = v instanceof Date ? v : new Date(v ?? 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function sortMediaDesc(list: MediaItem[]): MediaItem[] {
  return [...list].sort((a, b) => {
    const tb = toTime(b.createdAt);
    const ta = toTime(a.createdAt);
    if (tb !== ta) return tb - ta;
    return (b.order_in_board ?? 0) - (a.order_in_board ?? 0);
  });
}

export function groupByDay(list: MediaItem[]): DayGroup[] {
  const map = new Map<string, MediaItem[]>();

  for (const it of list) {
    const key = toDayKey(it.createdAt);
    const arr = map.get(key) ?? [];
    arr.push(it);
    map.set(key, arr);
  }

  const groups = Array.from(map.entries()).map(([dayKey, items]) => ({
    dayKey,
    items: sortMediaDesc(items),
  }));

  groups.sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1));
  return groups;
}
