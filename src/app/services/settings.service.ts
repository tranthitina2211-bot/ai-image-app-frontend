import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, EMPTY } from 'rxjs';
import { catchError, debounceTime, switchMap, tap } from 'rxjs/operators';

import {
  AppSettings,
  AppTheme,
  DefaultRatio,
  GridSize,
  UserGender
} from '@models/app-settings.model';
import { AuthStateService } from './auth-state.service';

const SETTINGS_STORAGE_KEY = 'app_settings';

const SETTINGS_DEFAULT: AppSettings = {
  profile: {
    displayName: 'Guest User',
    gender: 'prefer_not_to_say',
    birthYear: null,
    phone: '',
    avatarUrl: ''
  },
  theme: 'dark',
  gridSize: 'medium',
  autoplayVideoPreview: true,
  confirmBeforeDelete: true,
  defaultRatio: '1:1',
  autoOpenResult: true,
  autoSavePrompt: true
};

export interface UserSettings {
  profile?: Partial<AppSettings['profile']>;
  theme?: string;
  gridSize?: string;
  autoSavePrompt?: boolean;
  confirmDelete?: boolean;
  confirmBeforeDelete?: boolean;
  autoplayVideo?: boolean;
  autoplayVideoPreview?: boolean;
  defaultRatio?: string;
  autoOpenResult?: boolean;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly syncQueue$ = new Subject<AppSettings>();
  private readonly settingsSubject = new BehaviorSubject<AppSettings>(this.loadSettings());

  readonly settings$ = this.settingsSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authState: AuthStateService
  ) {
    if (this.authState.isLoggedIn) {
      this.fetchRemote();
    }

    this.authState.loggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.fetchRemote();
      } else {
        const next = this.loadSettings();
        this.settingsSubject.next(next);
      }
    });

    this.syncQueue$
      .pipe(
        debounceTime(450),
        switchMap(settings => {
          if (!this.authState.isLoggedIn) {
            return EMPTY;
          }

          return this.http.put<UserSettings>('/api/settings', settings).pipe(
            tap(remote => this.hydrate(remote ?? null)),
            catchError(error => {
              console.error('[SETTINGS] sync failed', error);
              return EMPTY;
            })
          );
        })
      )
      .subscribe();
  }

  getSnapshot(): AppSettings {
    return this.settingsSubject.value;
  }

  update(patch: Partial<AppSettings>): void {
    const current = this.settingsSubject.value;

    const next: AppSettings = {
      ...current,
      ...patch,
      profile: {
        ...current.profile,
        ...(patch.profile ?? {})
      }
    };

    this.settingsSubject.next(next);
    this.saveSettings(next);
    this.scheduleSync(next);
  }

  updateProfile(profilePatch: Partial<AppSettings['profile']>): void {
    const current = this.settingsSubject.value;

    const patchGender = profilePatch.gender;
    const nextGender: UserGender = this.isGender(patchGender)
      ? patchGender
      : current.profile.gender;

    const nextBirthYear = this.normalizeBirthYear(
      profilePatch.birthYear ?? current.profile.birthYear
    );

    const nextPhone = String(profilePatch.phone ?? current.profile.phone ?? '');

    const next: AppSettings = {
      ...current,
      profile: {
        ...current.profile,
        ...profilePatch,
        gender: nextGender,
        birthYear: nextBirthYear,
        phone: nextPhone
      }
    };

    this.settingsSubject.next(next);
    this.saveSettings(next);
    this.scheduleSync(next);
  }

  reset(): void {
    const next = this.cloneDefaults();
    this.settingsSubject.next(next);
    this.saveSettings(next);
    this.scheduleSync(next);
  }

  hydrate(payload: UserSettings | null): void {
    const normalized = this.unwrapPayload(payload);
    const current = this.settingsSubject.value;
    const base = current ?? this.cloneDefaults();

    const rawProfile = normalized?.profile ?? {};

    const profile = {
      displayName: this.pickString(rawProfile, 'displayName', 'display_name') ?? base.profile.displayName,
      avatarUrl: this.pickString(rawProfile, 'avatarUrl', 'avatar_url') ?? base.profile.avatarUrl,
      phone: this.pickString(rawProfile, 'phone') ?? base.profile.phone,
      gender: this.isGender(rawProfile?.gender)
        ? rawProfile.gender as UserGender
        : base.profile.gender,
      birthYear: this.normalizeBirthYear(
        this.pickNumberOrNull(rawProfile, 'birthYear', 'birth_year') ?? base.profile.birthYear
      )
    };

    const rawTheme = this.pickString(normalized, 'theme');
    const rawGridSize = this.pickString(normalized, 'gridSize', 'grid_size');
    const rawDefaultRatio = this.pickString(normalized, 'defaultRatio', 'default_ratio');

    const nextTheme: AppTheme = this.isTheme(rawTheme)
      ? rawTheme
      : (base.theme ?? SETTINGS_DEFAULT.theme);

    const nextGridSize: GridSize = this.isGridSize(rawGridSize)
      ? rawGridSize
      : (base.gridSize ?? SETTINGS_DEFAULT.gridSize);

    const nextDefaultRatio: DefaultRatio = this.isDefaultRatio(rawDefaultRatio)
      ? rawDefaultRatio
      : (base.defaultRatio ?? SETTINGS_DEFAULT.defaultRatio);

    const next: AppSettings = {
      ...this.cloneDefaults(),
      ...base,
      profile,
      theme: nextTheme,
      gridSize: nextGridSize,
      defaultRatio: nextDefaultRatio,
      autoOpenResult:
        this.pickBoolean(normalized, 'autoOpenResult', 'auto_open_result')
        ?? base.autoOpenResult,
      autoSavePrompt:
        this.pickBoolean(normalized, 'autoSavePrompt', 'auto_save_prompt')
        ?? base.autoSavePrompt,
      confirmBeforeDelete:
        this.pickBoolean(normalized, 'confirmBeforeDelete', 'confirmDelete', 'confirm_before_delete', 'confirm_delete')
        ?? base.confirmBeforeDelete,
      autoplayVideoPreview:
        this.pickBoolean(normalized, 'autoplayVideoPreview', 'autoplayVideo', 'autoplay_video_preview', 'autoplay_video')
        ?? base.autoplayVideoPreview
    };

    this.settingsSubject.next(next);
    this.saveSettings(next);
  }

  fetchRemote(): void {
    if (!this.authState.isLoggedIn) return;

    this.http.get<UserSettings>('/api/settings').subscribe({
      next: payload => this.hydrate(payload ?? null),
      error: error => console.error('[SETTINGS] fetch remote failed', error)
    });
  }

  private unwrapPayload(payload: any): UserSettings | null {
    if (!payload || typeof payload !== 'object') return null;

    let current: any = payload;

    for (let i = 0; i < 3; i++) {
      if (current?.data && typeof current.data === 'object') {
        current = current.data;
        continue;
      }

      if (current?.settings && typeof current.settings === 'object') {
        current = current.settings;
        continue;
      }

      break;
    }

    return current as UserSettings;
  }

  private normalizeBirthYear(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    return Number.isInteger(numeric) ? numeric : null;
  }

  private scheduleSync(settings: AppSettings): void {
    this.syncQueue$.next(settings);
  }

  private loadSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);

      if (!raw) {
        return this.cloneDefaults();
      }

      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      const parsedProfile = parsed?.profile;
      const parsedTheme = parsed?.theme;
      const parsedGridSize = parsed?.gridSize;
      const parsedDefaultRatio = parsed?.defaultRatio;
      const parsedGender = parsedProfile?.gender;

      const safeTheme: AppTheme = this.isTheme(parsedTheme)
        ? parsedTheme
        : SETTINGS_DEFAULT.theme;

      const safeGridSize: GridSize = this.isGridSize(parsedGridSize)
        ? parsedGridSize
        : SETTINGS_DEFAULT.gridSize;

      const safeDefaultRatio: DefaultRatio = this.isDefaultRatio(parsedDefaultRatio)
        ? parsedDefaultRatio
        : SETTINGS_DEFAULT.defaultRatio;

      const safeGender: UserGender = this.isGender(parsedGender)
        ? parsedGender
        : SETTINGS_DEFAULT.profile.gender;

      return {
        ...this.cloneDefaults(),
        ...parsed,
        theme: safeTheme,
        gridSize: safeGridSize,
        defaultRatio: safeDefaultRatio,
        profile: {
          ...SETTINGS_DEFAULT.profile,
          ...(parsedProfile ?? {}),
          displayName:
            parsedProfile?.displayName ?? SETTINGS_DEFAULT.profile.displayName,
          avatarUrl:
            parsedProfile?.avatarUrl ?? SETTINGS_DEFAULT.profile.avatarUrl,
          gender: safeGender,
          birthYear: this.normalizeBirthYear(parsedProfile?.birthYear),
          phone: String(parsedProfile?.phone ?? '')
        }
      };
    } catch (error) {
      console.warn('[SettingsService] load failed:', error);
      return this.cloneDefaults();
    }
  }

  private saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('[SettingsService] save failed:', error);
    }
  }

  private cloneDefaults(): AppSettings {
    return {
      ...SETTINGS_DEFAULT,
      profile: { ...SETTINGS_DEFAULT.profile }
    };
  }

  private isDefaultRatio(value: unknown): value is DefaultRatio {
    return ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(String(value));
  }

  private isTheme(value: unknown): value is AppTheme {
    return ['dark', 'light', 'system'].includes(String(value));
  }

  private isGridSize(value: unknown): value is GridSize {
    return ['small', 'medium', 'large'].includes(String(value));
  }

  private isGender(value: unknown): value is UserGender {
    return ['male', 'female', 'other', 'prefer_not_to_say'].includes(String(value));
  }

  private pickString(source: any, ...keys: string[]): string | undefined {
    for (const key of keys) {
      const value = source?.[key];
      if (typeof value === 'string' && value.trim() !== '') {
        return value;
      }
    }
    return undefined;
  }

  private pickBoolean(source: any, ...keys: string[]): boolean | undefined {
    for (const key of keys) {
      const value = source?.[key];
      if (typeof value === 'boolean') {
        return value;
      }
    }
    return undefined;
  }

  private pickNumberOrNull(source: any, ...keys: string[]): number | null | undefined {
    for (const key of keys) {
      const value = source?.[key];
      if (value === null) return null;
      if (value === undefined || value === '') continue;

      const numeric = Number(value);
      if (Number.isInteger(numeric)) return numeric;
    }
    return undefined;
  }
}
