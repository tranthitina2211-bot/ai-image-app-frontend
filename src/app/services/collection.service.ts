import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Collection } from '@models/collection.model';
import { AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private subject = new BehaviorSubject<Collection[]>([]);
  collections$ = this.subject.asObservable();

  constructor(private http: HttpClient, private authState: AuthStateService) {
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

  create(name: string): Collection {
    const fallback: Collection = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Untitled',
      itemIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.http.post<Collection>('/api/collections', { name: fallback.name }).subscribe({
      next: () => this.refresh(),
      error: () => {}
    });

    return fallback;
  }

  rename(id: string, name: string) {
    this.http.patch(`/api/collections/${id}`, { name: name.trim() }).subscribe({
      next: () => this.refresh(),
      error: () => {}
    });
  }

  delete(id: string) {
    this.http.delete(`/api/collections/${id}`).subscribe({
      next: () => this.refresh(),
      error: () => {}
    });
  }

  addItems(id: string, itemIds: string[]) {
    this.http.post(`/api/collections/${id}/items`, { itemIds }).subscribe({
      next: () => this.refresh(),
      error: () => {}
    });
  }

  removeItem(id: string, itemId: string) {
    this.http.delete(`/api/collections/${id}/items/${itemId}`).subscribe({
      next: () => this.refresh(),
      error: () => {}
    });
  }

  reorder(id: string, from: number, to: number) {
    const col = this.getById(id);
    if (!col) return;
    const arr = [...col.itemIds];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    this.http.post(`/api/collections/${id}/reorder`, { itemIds: arr }).subscribe({
      next: () => this.refresh(),
      error: () => {}
    });
  }
}
