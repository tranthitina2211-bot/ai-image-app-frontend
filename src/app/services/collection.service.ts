import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, tap, catchError } from 'rxjs/operators';
import { Collection } from '@models/collection.model';
import { AuthStateService } from './auth-state.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private subject = new BehaviorSubject<Collection[]>([]);
  collections$ = this.subject.asObservable();

  constructor(private http: HttpClient, private authState: AuthStateService, private notifications: NotificationService) {
    if (this.authState.isLoggedIn) {
      this.refresh();
    }

    this.authState.loggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) this.refresh();
      else this.subject.next([]);
    });
  }

  refresh(): void {
    this.http.get<any>('/api/collections').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        this.subject.next(list);
      },
      error: () => {}
    });
  }

  snapshot(): Collection[] { return this.subject.value; }

  getById(id: string): Collection | undefined {
    return this.snapshot().find(c => c.id === id);
  }

  create(name: string): Observable<Collection> {
    const optimistic: Collection = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Untitled',
      itemIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.subject.next([optimistic, ...this.snapshot()]);

    return this.http.post<any>('/api/collections', { name: optimistic.name }).pipe(
      map((res: any) => res?.data ?? res),
      tap((created: Collection) => {
        const next = this.snapshot().map(item => item.id === optimistic.id ? created : item);
        this.subject.next(next);
        this.notifications.refresh();
      }),
      catchError(() => {
        this.subject.next(this.snapshot().filter(item => item.id !== optimistic.id));
        return of(optimistic);
      })
    );
  }

  rename(id: string, name: string) {
    const next = this.snapshot().map(item => item.id === id ? { ...item, name: name.trim() } : item);
    this.subject.next(next);
    this.http.patch(`/api/collections/${id}`, { name: name.trim() }).subscribe({
      next: () => this.refresh(),
      error: () => this.refresh()
    });
  }

  delete(id: string) {
    const prev = this.snapshot();
    this.subject.next(prev.filter(item => item.id !== id));
    this.http.delete(`/api/collections/${id}`).subscribe({
      next: () => this.notifications.refresh(),
      error: () => this.subject.next(prev)
    });
  }

  addItems(id: string, itemIds: string[]) {
    const next = this.snapshot().map(item => item.id === id ? ({ ...item, itemIds: [...new Set([...item.itemIds, ...itemIds])] }) : item);
    this.subject.next(next);
    this.http.post(`/api/collections/${id}/items`, { itemIds }).subscribe({
      next: () => { this.refresh(); this.notifications.refresh(); },
      error: () => this.refresh()
    });
  }

  removeItem(id: string, itemId: string) {
    const next = this.snapshot().map(item => item.id === id ? ({ ...item, itemIds: item.itemIds.filter(existing => existing !== itemId) }) : item);
    this.subject.next(next);
    this.http.delete(`/api/collections/${id}/items/${itemId}`).subscribe({
      next: () => this.notifications.refresh(),
      error: () => this.refresh()
    });
  }

  reorder(id: string, from: number, to: number) {
    const col = this.getById(id);
    if (!col) return;
    const arr = [...col.itemIds];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    this.subject.next(this.snapshot().map(item => item.id === id ? ({ ...item, itemIds: arr }) : item));
    this.http.post(`/api/collections/${id}/reorder`, { itemIds: arr }).subscribe({
      next: () => {},
      error: () => this.refresh()
    });
  }
}
