import { MediaItem } from '@models/media.model';

export type DayKey = string;

export function sortByCreatedDesc(list: MediaItem[]) {
  return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function selectAll(list: MediaItem[]) {
  return sortByCreatedDesc(list);
}

export function selectFavorites(list: MediaItem[]) {
  return sortByCreatedDesc(list.filter(x => x.favorite));
}

export function dayKey(date: Date | string): DayKey {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function groupByDay(list: MediaItem[]): Array<{ day: DayKey; items: MediaItem[] }> {
  const map = new Map<DayKey, MediaItem[]>();

  for (const item of sortByCreatedDesc(list)) {
    const key = dayKey(item.createdAt);
    const arr = map.get(key) ?? [];
    arr.push(item);
    map.set(key, arr);
  }

  return [...map.entries()].map(([day, items]) => ({ day, items }));
}
