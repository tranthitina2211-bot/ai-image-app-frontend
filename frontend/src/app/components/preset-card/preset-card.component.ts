import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { MediaItem } from '@models/media.model';
import { Preset } from '@models/preset.model';

@Component({
  selector: 'app-preset-card',
  templateUrl: './preset-card.component.html',
  styleUrls: ['./preset-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetCardComponent {
  @Input() preset!: Preset;
  @Input() previewItem: MediaItem | null = null;
  @Input() previewCount = 0;
  @Input() hasVideo = false;
  @Input() cardIndex = 0;

  @Output() open = new EventEmitter<void>();
  @Output() copyPrompt = new EventEmitter<void>();
  @Output() usePreset = new EventEmitter<void>();

  onOpen(): void {
    this.open.emit();
  }

  onCopyPrompt(event: MouseEvent): void {
    event.stopPropagation();
    this.copyPrompt.emit();
  }

  onUsePreset(event: MouseEvent): void {
    event.stopPropagation();
    this.usePreset.emit();
  }

  get categoryLabel(): string {
    const category = this.preset?.category ?? '';
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  get hasPreview(): boolean {
    return !!this.previewItem?.url;
  }

  get sizeClass(): string {
    const mod = this.cardIndex % 5;
    if (this.preset?.type === 'video') return 'size-tall';
    if (this.previewCount >= 3 && mod === 0) return 'size-xl';
    if (mod === 1) return 'size-md';
    if (mod === 2) return 'size-sm';
    if (mod === 3) return 'size-lg';
    return 'size-md';
  }
  forceMute(ev: Event) {
    const v = ev.target as HTMLVideoElement | null;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.volume = 0;
    setTimeout(() => {
      v.muted = true;
      v.defaultMuted = true;
      v.volume = 0;
    }, 0);
  }
}
