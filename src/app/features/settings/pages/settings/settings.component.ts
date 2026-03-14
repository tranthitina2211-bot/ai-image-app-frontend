import { Component } from '@angular/core';
import { map } from 'rxjs/operators';

import {
  AppTheme,
  DefaultRatio,
  GridSize,
  UserGender
} from '@models/app-settings.model';
import { SettingsService } from '@services/settings.service';
import { PromptBridgeService } from '@services/promptbridge.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  version = 'v0.3.0';

  settings$ = this.settingsService.settings$;

  vm$ = this.settings$.pipe(
    map(settings => ({
      settings,
      version: this.version,
    }))
  );

  themeOptions: { value: AppTheme; label: string }[] = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'system', label: 'System' }
  ];

  gridSizeOptions: { value: GridSize; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  ratioOptions: { value: DefaultRatio; label: string }[] = [
    { value: '1:1', label: '1:1' },
    { value: '3:4', label: '3:4' },
    { value: '4:3', label: '4:3' },
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' }
  ];

  genderOptions: { value: UserGender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  constructor(
    private settingsService: SettingsService,
    private promptBridge: PromptBridgeService
  ) {}

  updateTheme(value: string): void {
    this.settingsService.update({ theme: value as AppTheme });
  }

  updateGridSize(value: string): void {
    this.settingsService.update({ gridSize: value as GridSize });
  }

  updateDefaultRatio(value: string): void {
    this.settingsService.update({ defaultRatio: value as DefaultRatio });
  }

  updateDisplayName(value: string): void {
    this.settingsService.updateProfile({ displayName: value });
  }

  updateGender(value: string): void {
    this.settingsService.updateProfile({ gender: value as UserGender });
  }

  updateBirthYear(value: string): void {
    const trimmed = value.trim();
    this.settingsService.updateProfile({ birthYear: trimmed ? Number(trimmed) : null });
  }

  updatePhone(value: string): void {
    this.settingsService.updateProfile({ phone: value });
  }

  updateAvatarUrl(value: string): void {
    this.settingsService.updateProfile({ avatarUrl: value });
  }

  toggleAutoplayVideoPreview(checked: boolean): void {
    this.settingsService.update({ autoplayVideoPreview: checked });
  }

  toggleConfirmBeforeDelete(checked: boolean): void {
    this.settingsService.update({ confirmBeforeDelete: checked });
  }

  toggleAutoOpenResult(checked: boolean): void {
    this.settingsService.update({ autoOpenResult: checked });
  }

  toggleAutoSavePrompt(checked: boolean): void {
    this.settingsService.update({ autoSavePrompt: checked });
    if (!checked) {
      this.promptBridge.clear();
    }
  }

  resetSettings(): void {
    const confirmed = window.confirm('Reset all settings to default values?');
    if (!confirmed) return;

    this.settingsService.reset();
  }

  trackByValue(_: number, item: { value: string; label: string }): string {
    return item.value;
  }
}
