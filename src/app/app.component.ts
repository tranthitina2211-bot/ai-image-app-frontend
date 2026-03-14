import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { SettingsService } from '@services/settings.service';
import { AuthStateService } from '@services/auth-state.service';
import { AuthService } from './features/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private mediaQuery?: MediaQueryList;
  private mediaQueryHandler?: () => void;

  constructor(
    private settingsService: SettingsService,
    private renderer: Renderer2,
    private authState: AuthStateService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.applyTheme(settings.theme);

        if (settings.theme === 'system') {
          this.bindSystemThemeListener();
        } else {
          this.unbindSystemThemeListener();
        }
      });

    if (this.authState.token) {
      this.authService.me().subscribe({
        next: (res) => {
          const data = res?.data;
          if (!res?.success || !data) return;

          this.authState.setUser({
            id: data.id,
            name: data.name,
            email: data.email
          });

          this.settingsService.hydrate(data.settings ?? null);
        },
        error: () => {
          this.authState.logout();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.unbindSystemThemeListener();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyTheme(theme: 'dark' | 'light' | 'system'): void {
    const resolved = theme === 'system' ? this.getSystemTheme() : theme;

    this.renderer.removeClass(document.body, 'theme-dark');
    this.renderer.removeClass(document.body, 'theme-light');
    this.renderer.removeClass(document.documentElement, 'theme-dark');
    this.renderer.removeClass(document.documentElement, 'theme-light');

    this.renderer.addClass(document.body, `theme-${resolved}`);
    this.renderer.addClass(document.documentElement, `theme-${resolved}`);
  }

  private getSystemTheme(): 'dark' | 'light' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  private bindSystemThemeListener(): void {
    if (this.mediaQuery) return;

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryHandler = () => {
      const current = this.settingsService.getSnapshot().theme;
      if (current === 'system') {
        this.applyTheme('system');
      }
    };

    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
    } else {
      this.mediaQuery.addListener(this.mediaQueryHandler);
    }
  }

  private unbindSystemThemeListener(): void {
    if (!this.mediaQuery || !this.mediaQueryHandler) return;

    if (this.mediaQuery.removeEventListener) {
      this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
    } else {
      this.mediaQuery.removeListener(this.mediaQueryHandler);
    }

    this.mediaQuery = undefined;
    this.mediaQueryHandler = undefined;
  }
}
