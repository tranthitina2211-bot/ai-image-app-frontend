import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([
    {
      id: 'n1',
      title: 'Video render completed',
      message: 'Your cinematic koi-fish clip is now ready to view.',
      time: '2 min ago',
      unread: true,
      category: 'generate',
      route: '/app/my-images',
      icon: 'movie'
    },
    {
      id: 'n2',
      title: '4 new variations are ready',
      message: 'The neon portrait batch finished successfully.',
      time: '18 min ago',
      unread: true,
      category: 'generate',
      route: '/app/create',
      icon: 'auto_awesome'
    },
    {
      id: 'n3',
      title: 'Your Pro plan renews tomorrow',
      message: 'Payment method ending in 2048 will be charged automatically.',
      time: 'Today',
      unread: false,
      category: 'billing',
      route: '/app/billing',
      icon: 'credit_card'
    },
    {
      id: 'n4',
      title: 'Collection updated',
      message: '“Character Concepts” now has 12 saved items.',
      time: 'Yesterday',
      unread: false,
      category: 'social',
      route: '/app/favorites',
      icon: 'collections_bookmark'
    },
    {
      id: 'n5',
      title: 'System maintenance notice',
      message: 'Rendering may be slower between 01:00 and 02:00 UTC+7.',
      time: '2 days ago',
      unread: false,
      category: 'system',
      route: '/app/notifications',
      icon: 'campaign'
    }
  ]);

  readonly notifications$ = this.notificationsSubject.asObservable();

  get snapshot(): AppNotification[] {
    return this.notificationsSubject.value;
  }

  markAsRead(id: string): void {
    this.notificationsSubject.next(
      this.snapshot.map((item) =>
        item.id === id ? { ...item, unread: false } : item
      )
    );
  }

  markAllAsRead(): void {
    this.notificationsSubject.next(
      this.snapshot.map((item) => ({ ...item, unread: false }))
    );
  }

  unreadCount(): number {
    return this.snapshot.filter((item) => item.unread).length;
  }
}
