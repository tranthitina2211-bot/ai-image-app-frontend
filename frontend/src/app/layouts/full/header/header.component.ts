import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStateService } from '@services/auth-state.service';
import { NotificationService, AppNotification } from '@services/notification.service';
import { AuthService } from '@features/auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class AppHeaderComponent {
  constructor(
    public readonly authState: AuthStateService,
    public readonly notifications: NotificationService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  get isLoggedIn(): boolean {
    return this.authState.isLoggedIn;
  }

  get user() {
    return this.authState.currentUser;
  }

  get notificationItems(): AppNotification[] {
    return this.notifications.snapshot.slice(0, 3);
  }

  get displayUnreadCount(): string {
    const count = this.notifications.unreadCount();
    return count > 9 ? '9+' : String(count);
  }

  login(): void {
    this.router.navigateByUrl('/auth/login');
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authState.logout();
        this.router.navigateByUrl('/auth/login');
      },
      error: () => {
        this.authState.logout();
        this.router.navigateByUrl('/auth/login');
      }
    });
  }

  openNotification(item: AppNotification): void {
    this.notifications.markAsRead(item.id);
    this.router.navigateByUrl(item.route);
  }
}
