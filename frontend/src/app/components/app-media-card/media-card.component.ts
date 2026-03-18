import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  QueryList,
  ViewChildren,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { Subject, startWith, takeUntil } from 'rxjs';

import { MediaItem } from '@models/media.model';
import { SettingsService } from '@services/settings.service';
import { GenerateService } from 'src/app/core/generate/generate.service';

@Component({
  selector: 'app-media-card',
  templateUrl: './media-card.component.html',
  styleUrls: ['./media-card.component.scss']
})
export class MediaCardComponent implements AfterViewInit, OnDestroy {
  @Input() item!: MediaItem;

  @Input() selected = false;
  @Input() selectable = false;

  @Output() cardClick = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<MediaItem>();

  @ViewChildren('videoEl')
  videos!: QueryList<ElementRef<HTMLVideoElement>>;

  autoplayEnabled = true;
  private destroy$ = new Subject<void>();

  constructor(private settingsService: SettingsService ,private generateService: GenerateService) {}

  ngAfterViewInit() {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.autoplayEnabled = settings.autoplayVideoPreview;
        this.syncVideos();
      });

    this.videos.changes
      .pipe(startWith(this.videos), takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncVideos();
      });

    setTimeout(() => this.syncVideos());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCardClick(e: MouseEvent) {
    e.stopPropagation();
    this.cardClick.emit();
  }

  onCancel(item: MediaItem) {
    this.generateService.cancel(item);
  }

  forceMute(ev: Event) {
    const v = ev.target as HTMLVideoElement | null;
    if (!v) return;

    v.muted = true;
    v.defaultMuted = true;
    v.volume = 0;

    if (this.autoplayEnabled) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }

    setTimeout(() => {
      v.muted = true;
      v.defaultMuted = true;
      v.volume = 0;

      if (this.autoplayEnabled) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    }, 0);
  }

  private syncVideos(): void {
    if (!this.videos) return;

    this.videos.forEach(v => {
      const video = v.nativeElement;
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;

      if (this.autoplayEnabled) {
        video.play().catch(() => {});
      } else {
        video.pause();
        try {
          video.currentTime = 0;
        } catch {}
      }
    });
  }
}
