import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MediaItem } from '@models/media.model';
import { AuthStateService } from './auth-state.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private mediaListSubject = new BehaviorSubject<MediaItem[]>([]);
  readonly list$ = this.mediaListSubject.asObservable();

  constructor(
    private ngZone: NgZone,
    private http: HttpClient,
    private authState: AuthStateService,
    private notifications: NotificationService
  ) {
    if (this.authState.isLoggedIn) {
      this.refresh();
    }

    this.authState.loggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.refresh();
      } else {
        this.emit([]);
      }
    });
  }

  refresh(): void {
    this.http.get<any>('/api/media?per_page=60').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        this.emit(this.normalizeList(list));
      },
      error: (error) => {
        console.error('[MEDIA] refresh failed', error);
      }
    });
  }

  snapshot(): MediaItem[] {
    return this.mediaListSubject.value;
  }

  getById(id: string): MediaItem | undefined {
    return this.mediaListSubject.value.find(item => item.id === id);
  }

  getManyByIds(ids: string[]): MediaItem[] {
    if (!ids?.length) return [];
    const map = new Map(this.mediaListSubject.value.map(item => [item.id, item] as const));
    return ids.map(id => map.get(id)).filter((item): item is MediaItem => !!item);
  }

  private emit(list: MediaItem[]) {
    this.ngZone.run(() => this.mediaListSubject.next(list));
  }

  setList(list: MediaItem[]) {
    this.emit(this.normalizeList(list));
  }

  add(item: MediaItem) {
    this.emit(this.normalizeList([item, ...this.mediaListSubject.value]));
  }

  patch(id: string, partial: Partial<MediaItem>) {
    const next = this.mediaListSubject.value.map(it => it.id === id ? ({ ...it, ...partial }) : it);
    this.emit(this.normalizeList(next));
  }

  remove(id: string, sync = true) {
    const next = this.mediaListSubject.value.filter(it => it.id !== id && it.ghostOf !== id);
    this.emit(this.normalizeList(next));
    if (sync) {
      this.http.delete(`/api/media/${id}`).subscribe({ error: () => this.refresh() });
    }
  }

  mergeStacks(source: MediaItem[], targetStackId: string) {
    const sourceStackId = source[0]?.id_stack;
    if (!sourceStackId || sourceStackId === targetStackId) return;

    const current = this.mediaListSubject.value;
    const maxOrder = current
      .filter(x => x.id_stack === targetStackId)
      .reduce((m, x) => Math.max(m, x.order_in_stack), 0);

    const sourceIds = new Set(source.map(s => s.id));
    let orderCursor = maxOrder + 1;

    const optimistic = current.map(item => {
      if (!sourceIds.has(item.id)) return item;
      return { ...item, id_stack: targetStackId, order_in_stack: orderCursor++ };
    });

    this.emit(optimistic);

    this.http.post('/api/stacks/merge', {
      sourceStackId,
      targetStackId
    }).subscribe({
      next: () => this.refresh(),
      error: () => this.refresh()
    });
  }

  toggleFavorite(id: string) {
    const target = this.getById(id);
    if (!target) return;

    const shouldFavorite = !target.favorite;
    const next = this.snapshot().map(x => x.id === id ? { ...x, favorite: shouldFavorite } : x);
    this.emit(next);

    const req = target.favorite
      ? this.http.delete<any>(`/api/media/${id}/favorite`)
      : this.http.post<any>(`/api/media/${id}/favorite`, {});

    req.subscribe({
      next: () => {
        this.patch(id, { favorite: shouldFavorite });
        this.notifications.refresh();
      },
      error: () => this.refresh()
    });
  }

  dropOutFromStack(itemId: string) {
    const current = this.snapshot();
    const item = current.find(x => x.id === itemId);
    if (!item) return;

    const stackId = item.id_stack;
    const stackItems = current
      .filter(x => x.id_stack === stackId)
      .sort((a, b) => a.order_in_stack - b.order_in_stack);

    if (stackItems.length <= 1) return;

    const remaining = stackItems.filter(x => x.id !== itemId);

    const next = current.map(media => {
      if (media.id === itemId) {
        return { ...media, id_stack: media.id, order_in_stack: 1, order_in_board: Date.now() };
      }
      if (media.id_stack !== stackId) return media;
      const newIndex = remaining.findIndex(x => x.id === media.id);
      return { ...media, order_in_stack: newIndex + 1 };
    });

    this.emit(next);

    this.http.post('/api/stacks/split', { itemId }).subscribe({
      next: () => this.refresh(),
      error: () => this.refresh()
    });
  }

  private normalizeList(list: any[]): MediaItem[] {
    return [...list]
      .map((item): MediaItem => ({
        ...(item as MediaItem),
        kind: 'media' as const,
        url: typeof item.url === 'string' ? item.url : '',
        createdAt: item.createdAt instanceof Date
          ? item.createdAt
          : new Date(item.createdAt ?? Date.now()),
        favorite: Boolean(item.favorite),
        progress: Number(item.progress ?? 0)
      }))
      .sort((a, b) => (b.order_in_board ?? 0) - (a.order_in_board ?? 0));
  }
}
