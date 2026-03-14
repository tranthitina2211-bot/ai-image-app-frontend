import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { Subject, startWith, takeUntil } from 'rxjs';
import { CdkDragMove } from '@angular/cdk/drag-drop';

import { MediaItem } from '@models/media.model';
import { SettingsService } from '@services/settings.service';

@Component({
  selector: 'app-board-item',
  templateUrl: './board-item.component.html',
  styleUrls: ['./board-item.component.scss']
})
export class BoardItemComponent implements AfterViewInit, OnDestroy {
  @Output() cancel = new EventEmitter<MediaItem>();

  @Input() isHoverTarget = false;
  @Input() isMergingOut = false;
  @Input() isMergingIn = false;

  @Output() dragHover = new EventEmitter<string | null>();

  @Input() items: MediaItem[] = [];

  @Output() select = new EventEmitter<{ items: MediaItem[]; rect: DOMRect }>();

  @Output() mergeDrop = new EventEmitter<{
    source: MediaItem[];
    targetStackId: string;
  }>();

  @ViewChildren('videoEl')
  videos!: QueryList<ElementRef<HTMLVideoElement>>;

  @ViewChild('card', { static: true })
  cardRef!: ElementRef<HTMLElement>;

  lastPoint: { x: number; y: number } | null = null;
  isDragging = false;
  autoplayEnabled = true;

  private destroy$ = new Subject<void>();

  constructor(private settingsService: SettingsService) {}

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

  onCancel(event: MouseEvent, item: MediaItem) {
    event.stopPropagation();
    this.cancel.emit(item);
  }

  onDragMoved(ev: CdkDragMove) {
    this.isDragging = true;
    this.lastPoint = ev.pointerPosition;

    const el = document.elementFromPoint(this.lastPoint.x, this.lastPoint.y) as HTMLElement | null;
    const card = el?.closest?.('.board-card') as HTMLElement | null;
    const targetStackId = card?.getAttribute('data-stack-id') ?? null;

    const selfId = this.items[0]?.id_stack;
    this.dragHover.emit(targetStackId && selfId && targetStackId !== selfId ? targetStackId : null);
  }

  onDragEndedMerge() {
    if (!this.lastPoint) {
      setTimeout(() => (this.isDragging = false), 0);
      return;
    }

    const el = document.elementFromPoint(
      this.lastPoint.x,
      this.lastPoint.y
    ) as HTMLElement | null;

    const card = el?.closest?.('.board-card') as HTMLElement | null;

    const targetStackId = card?.getAttribute('data-stack-id');
    const sourceStackId = this.items[0]?.id_stack;

    if (targetStackId && sourceStackId && targetStackId !== sourceStackId) {
      this.mergeDrop.emit({ source: this.items, targetStackId });
    }

    setTimeout(() => (this.isDragging = false), 0);
  }

  onClick(event: MouseEvent) {
    event.stopPropagation();

    const rect = this.cardRef.nativeElement.getBoundingClientRect();

    this.select.emit({
      items: this.items,
      rect
    });
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

    this.videos.forEach((v: ElementRef<HTMLVideoElement>) => {
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
