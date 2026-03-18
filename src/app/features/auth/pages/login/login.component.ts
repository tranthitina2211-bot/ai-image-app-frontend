import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStateService } from '@services/auth-state.service';
import { AuthService } from '../../auth.service';
import { MediaService } from '@services/media.service';
import { SettingsService } from '@services/settings.service';
import { CollectionService } from '@services/collection.service';
import { LoadingOverlayService } from '@services/loading-overlay.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email = 'demo@example.com';
  password = 'password';
  rememberMe = true;
  error = '';
  loading = false;
  fieldErrors: Record<string, string[]> = {};

  constructor(
    private readonly authState: AuthStateService,
    private readonly authService: AuthService,
    private readonly mediaService: MediaService,
    private readonly settingsService: SettingsService,
    private readonly collectionService: CollectionService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly loadingOverlay: LoadingOverlayService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const socialError = params.get('social_error');
      const token = params.get('token');
      const name = params.get('name');
      const email = params.get('email');
      const plan = params.get('plan');

      if (socialError) {
        this.error = decodeURIComponent(socialError);
      }

      if (token && email) {
        this.authState.login({
          token,
          user: {
            name: name ?? email,
            email,
            plan: plan ?? 'Free'
          }
        });

        this.loadingOverlay.show('Signing you in...', 'Preparing your workspace');
        this.settingsService.fetchRemote();
        this.mediaService.refresh();
        this.collectionService.refresh();
        const redirect = params.get('redirect') || '/app/create';
        this.router.navigateByUrl(redirect).finally(() => this.loadingOverlay.hide());
      }
    });
  }

  submit(): void {
    this.loading = true;
    this.error = '';
    this.fieldErrors = {};
    this.loadingOverlay.show('Signing you in...', 'Syncing settings, media, and collections');

    this.authService.login({ email: this.email, password: this.password, device_name: 'angular-web' }).subscribe({
      next: (res) => {
        const data = res?.data;

        if (!res?.success || !data?.token || !data?.user) {
          this.error = res?.message || 'Login failed';
          this.fieldErrors = this.normalizeErrors(res?.errors);
          this.loading = false;
          this.loadingOverlay.hide();
          return;
        }

        this.authState.login({
          token: data.token,
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            plan: data.user.plan ?? 'Free'
          }
        });

        this.settingsService.hydrate(data.settings ?? null);
        this.mediaService.refresh();
        this.collectionService.refresh();

        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/app/create';
        this.router.navigateByUrl(redirect).finally(() => this.loadingOverlay.hide());
      },
      error: (err) => {
        this.error = err?.error?.message || 'Login failed';
        this.fieldErrors = this.normalizeErrors(err?.error?.errors);
        this.loading = false;
        this.loadingOverlay.hide();
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  socialLogin(provider: 'google' | 'github' | 'facebook'): void {
    const url = this.authService.getSocialLoginUrl(provider);
    window.location.href = url;
  }

  getFieldError(field: string): string {
    return this.fieldErrors[field]?.[0] || '';
  }

  private normalizeErrors(errors: unknown): Record<string, string[]> {
    if (!errors || typeof errors !== 'object') return {};

    return Object.entries(errors as Record<string, string[] | string>).reduce((acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? value : [value];
      return acc;
    }, {} as Record<string, string[]>);
  }
}
