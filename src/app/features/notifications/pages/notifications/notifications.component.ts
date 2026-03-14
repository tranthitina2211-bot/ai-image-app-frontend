import { Component } from '@angular/core';
import { AppNotification, NotificationService, NotificationCategory } from '@services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent {
  activeFilter: 'all' | NotificationCategory = 'all';

  constructor(public readonly notifications: NotificationService) {}

  get items(): AppNotification[] {
    const source = this.notifications.snapshot;
    if (this.activeFilter === 'all') {
      return source;
    }
    return source.filter((item) => item.category === this.activeFilter);
  }
}
