import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStateService } from '@services/auth-state.service';
import { AuthService } from '../../auth.service';
import { MediaService } from '@services/media.service';
import { SettingsService } from '@services/settings.service';
import { CollectionService } from '@services/collection.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  name = 'Demo User';
  email = 'demo@example.com';
  password = 'Password1';
  passwordConfirmation = 'Password1';
  error = '';
  loading = false;
  fieldErrors: Record<string, string[]> = {};

  constructor(
    private readonly authState: AuthStateService,
    private readonly authService: AuthService,
    private readonly mediaService: MediaService,
    private readonly settingsService: SettingsService,
    private readonly collectionService: CollectionService,
    private readonly router: Router
  ) {}

  submit(): void {
    this.loading = true;
    this.error = '';
    this.fieldErrors = {};
    console.log('[AUTH] register submit', { email: this.email });

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
      password_confirmation: this.passwordConfirmation,
      device_name: 'angular-web'
    }).subscribe({
      next: (res) => {
        const data = res?.data;

        if (!res?.success || !data?.token || !data?.user) {
          this.error = res?.message || 'Register failed';
          this.fieldErrors = this.normalizeErrors(res?.errors);
          console.error('[AUTH] register rejected', res);
          this.loading = false;
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
        console.log('[AUTH] register success');
        this.router.navigateByUrl('/app/create');
      },
      error: (err) => {
        this.error = err?.error?.message || 'Register failed';
        this.fieldErrors = this.normalizeErrors(err?.error?.errors);
        console.error('[AUTH] register failed', err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
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
