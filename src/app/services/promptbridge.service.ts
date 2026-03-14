import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { MediaItem } from '@models/media.model';
import { PromptBridgeValue } from '@models/prompt-bridge.model';
import { SettingsService } from '@services/settings.service';

const PROMPT_BRIDGE_STORAGE_KEY = 'prompt_bridge_value';

@Injectable({ providedIn: 'root' })
export class PromptBridgeService {
  private mediaSubject = new BehaviorSubject<MediaItem | null>(null);
  media$ = this.mediaSubject.asObservable();

  private promptSubject = new BehaviorSubject<string | null>(null);
  prompt$ = this.promptSubject.asObservable();

  private valueSubject = new BehaviorSubject<PromptBridgeValue | null>(this.loadInitialValue());
  value$ = this.valueSubject.asObservable();

  constructor(private settingsService: SettingsService) {
    const initial = this.valueSubject.value;
    if (initial?.prompt != null) {
      this.promptSubject.next(initial.prompt);
    }

    this.settingsService.settings$.subscribe(settings => {
      if (!settings.autoSavePrompt) {
        localStorage.removeItem(PROMPT_BRIDGE_STORAGE_KEY);
      } else {
        this.persist(this.valueSubject.value);
      }
    });
  }

  snapshot(): PromptBridgeValue | null {
    return this.valueSubject.value;
  }

  clear(): void {
    this.mediaSubject.next(null);
    this.promptSubject.next(null);
    this.valueSubject.next(null);
    localStorage.removeItem(PROMPT_BRIDGE_STORAGE_KEY);
  }

  setMedia(item: MediaItem) {
    this.mediaSubject.next(item);

    const value: PromptBridgeValue = {
      source: 'media',
      prompt: item.prompt ?? '',
      type: item.type,
      ratio: item.ratio,
      seed: item.seed,
      mediaId: item.id
    };

    this.valueSubject.next(value);

    if (item.prompt != null) {
      this.promptSubject.next(item.prompt);
    }

    this.persist(value);
  }

  setPrompt(value: string) {
    this.promptSubject.next(value);

    const next: PromptBridgeValue = {
      ...(this.valueSubject.value ?? { source: 'manual', type: 'image' }),
      prompt: value
    };

    this.valueSubject.next(next);
    this.persist(next);
  }

  setValue(value: PromptBridgeValue) {
    this.valueSubject.next(value);

    if (value.prompt != null) {
      this.promptSubject.next(value.prompt);
    }

    this.persist(value);
  }

  private loadInitialValue(): PromptBridgeValue | null {
    if (!this.settingsService.getSnapshot().autoSavePrompt) {
      return null;
    }

    try {
      const raw = localStorage.getItem(PROMPT_BRIDGE_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PromptBridgeValue;
    } catch {
      return null;
    }
  }

  private persist(value: PromptBridgeValue | null): void {
    if (!this.settingsService.getSnapshot().autoSavePrompt) {
      return;
    }

    try {
      if (!value) {
        localStorage.removeItem(PROMPT_BRIDGE_STORAGE_KEY);
        return;
      }

      localStorage.setItem(PROMPT_BRIDGE_STORAGE_KEY, JSON.stringify(value));
    } catch {}
  }
}
