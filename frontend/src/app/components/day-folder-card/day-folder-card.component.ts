import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MediaItem } from '@models/media.model';

@Component({
  selector: 'app-day-folder-card',
  templateUrl: './day-folder-card.component.html',
  styleUrls: ['./day-folder-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayFolderCardComponent {
  @Input() dayKey!: string;
  @Input() count = 0;
  @Input() cover!: MediaItem;

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
