import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthStateService } from './auth-state.service';

export type NotificationCategory = 'generate' | 'billing' | 'system' | 'social';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  category: NotificationCategory;
  route: string;
  icon: string;
  type?: string;
  createdAt?: string;
  readAt?: string | null;
  meta?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authState: AuthStateService
  ) {
    if (this.authState.isLoggedIn) {
      this.refresh();
    }

    this.authState.loggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.refresh();
      } else {
        this.notificationsSubject.next([]);
      }
    });
  }

  get snapshot(): AppNotification[] {
    return this.notificationsSubject.value;
  }

  refresh(): void {
    if (!this.authState.isLoggedIn) {
      this.notificationsSubject.next([]);
      return;
    }

    this.http.get<any>('/api/notifications?per_page=50').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        this.notificationsSubject.next((list ?? []).map((item: any) => this.normalize(item)));
      },
      error: (error) => console.error('[NOTIFICATIONS] refresh failed', error)
    });
  }

  markAsRead(id: string): void {
    const previous = this.snapshot;
    this.notificationsSubject.next(
      previous.map(item => item.id === id ? { ...item, unread: false, readAt: new Date().toISOString() } : item)
    );

    this.http.post(`/api/notifications/${id}/read`, {}).subscribe({
      next: () => {},
      error: () => this.notificationsSubject.next(previous)
    });
  }

  markAllAsRead(): void {
    const previous = this.snapshot;
    const nowIso = new Date().toISOString();
    this.notificationsSubject.next(previous.map(item => ({ ...item, unread: false, readAt: nowIso })));

    this.http.post('/api/notifications/read-all', {}).subscribe({
      next: () => {},
      error: () => this.notificationsSubject.next(previous)
    });
  }

  unreadCount(): number {
    return this.snapshot.filter(item => item.unread).length;
  }

  prepend(notification: Partial<AppNotification>): void {
    const next: AppNotification = this.normalize({
      id: notification.id ?? `local-${Date.now()}`,
      title: notification.title ?? 'Notification',
      message: notification.message ?? '',
      time: notification.time ?? 'just now',
      unread: notification.unread ?? true,
      category: notification.category ?? 'system',
      route: notification.route ?? '/app/notifications',
      icon: notification.icon ?? 'notifications',
      type: notification.type ?? 'system.info',
      createdAt: notification.createdAt ?? new Date().toISOString(),
      readAt: notification.readAt ?? null,
      meta: notification.meta ?? {}
    });

    this.notificationsSubject.next([next, ...this.snapshot]);
  }

  private normalize(item: any): AppNotification {
    return {
      id: String(item?.id ?? `n-${Math.random().toString(36).slice(2)}`),
      title: String(item?.title ?? 'Notification'),
      message: String(item?.message ?? ''),
      time: String(item?.time ?? 'just now'),
      unread: Boolean(item?.unread ?? true),
      category: this.toCategory(item?.category),
      route: String(item?.route ?? '/app/notifications'),
      icon: String(item?.icon ?? 'notifications'),
      type: typeof item?.type === 'string' ? item.type : 'system.info',
      createdAt: typeof item?.createdAt === 'string' ? item.createdAt : undefined,
      readAt: typeof item?.readAt === 'string' ? item.readAt : null,
      meta: (item?.meta && typeof item.meta === 'object') ? item.meta : {}
    };
  }

  private toCategory(value: unknown): NotificationCategory {
    return value === 'generate' || value === 'billing' || value === 'social'
      ? value
      : 'system';
  }
}
