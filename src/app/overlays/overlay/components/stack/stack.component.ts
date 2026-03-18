import {
  Component,
  Input,
  ViewChildren,
  ViewChild,
  QueryList,
  ElementRef,
  Output,
  EventEmitter,
  AfterViewInit,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { MediaItem } from '@models/media.model';
import { OverlayService } from '@services/overlay.service';
import { PromptBridgeService } from '@services/promptbridge.service';
import { SettingsService } from '@services/settings.service';
import { MediaService } from '@services/media.service';

@Component({
  selector: 'app-stack',
  templateUrl: './stack.component.html',
  styleUrls: ['./stack.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Output() cancel = new EventEmitter<MediaItem>();
  @Input() items: MediaItem[] = [];
  @Input() actions: any[] = [];
  @Output() actionClick = new EventEmitter<{ actionId: string; item: MediaItem }>();

  @Input() overlayContext?: 'create' | 'my-images' | 'favorites' | 'presets' | 'collection';

  @Input() startIndex = 0;
  @Input() mode: 'list' | 'stack' = 'stack';
  @Output() indexChange = new EventEmitter<number>();

  private currentId: string | null = null;
  private destroy$ = new Subject<void>();
  private lastVolumeBeforeMute = 1;

  isMobile = false;
  thumbSize = 80;
  autoplayEnabled = true;

  get thumbItemSize(): number {
    return this.thumbSize + 12;
  }

  constructor(
    private promptBridge: PromptBridgeService,
    private overlayService: OverlayService,
    private settingsService: SettingsService,
    private mediaService: MediaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.updateDevice();
    window.addEventListener('resize', this.updateDevice);

    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.autoplayEnabled = settings.autoplayVideoPreview;
        this.syncVideoPlayback();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.updateDevice);
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    requestAnimationFrame(() => this.scrollToCurrentThumb(true));

    this.videoPlayers.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncVideoPlayback();
      });

    requestAnimationFrame(() => this.syncVideoPlayback());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.items || this.items.length === 0) {
      this.currentIndex = 0;
      this.currentId = null;
      this.emitIndexChangeSafely(0);
      this.cdr.markForCheck();
      return;
    }

    const itemsChanged = !!changes['items'];
    const startChanged = !!changes['startIndex'];
    const modeChanged = !!changes['mode'];

    if (this.mode === 'list' && (!this.currentId || startChanged || modeChanged)) {
      const max = this.items.length - 1;
      const idx = Math.max(0, Math.min(this.startIndex ?? 0, max));

      this.currentIndex = idx;
      this.currentId = this.items[idx]?.id ?? null;

      this.scrollToCurrentThumb(true);
      this.emitIndexChangeSafely(this.currentIndex);
      this.cdr.markForCheck();

      requestAnimationFrame(() => this.syncVideoPlayback());
      return;
    }

    if (!this.currentId) {
      this.currentId = this.items[this.currentIndex]?.id ?? this.items[0]?.id ?? null;
    }

    const idx = this.currentId ? this.items.findIndex(x => x.id === this.currentId) : -1;

    if (idx >= 0) {
      this.currentIndex = idx;
    } else {
      this.currentIndex = Math.min(this.currentIndex, this.items.length - 1);
      this.currentId = this.items[this.currentIndex]?.id ?? null;
    }

    if (itemsChanged) {
      this.emitIndexChangeSafely(this.currentIndex);
      requestAnimationFrame(() => this.syncVideoPlayback());
    }

    this.cdr.markForCheck();
  }

  private updateDevice = () => {
    this.isMobile = window.innerWidth < 768;
    this.thumbSize = this.isMobile ? 56 : 80;
  };

  onActionFromBar(actionId: string) {
    const item = this.current;
    if (!item) return;
    this.actionClick.emit({ actionId, item });
  }

  onCancel(event: MouseEvent, item: MediaItem) {
    event.stopPropagation();
    this.cancel.emit(item);
  }

  currentIndex = 0;

  get current(): MediaItem | null {
    return this.items[this.currentIndex] || null;
  }

  @ViewChild('mainVideo') mainVideo?: ElementRef<HTMLVideoElement>;
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;

  @ViewChild('thumbViewportMobile') thumbViewportMobile?: CdkVirtualScrollViewport;
  @ViewChild('thumbViewportDesktop') thumbViewportDesktop?: CdkVirtualScrollViewport;

  private get thumbViewport(): CdkVirtualScrollViewport | undefined {
    return this.isMobile ? this.thumbViewportMobile : this.thumbViewportDesktop;
  }

  scrollToCurrentThumb(center = false) {
    const vp = this.thumbViewport;
    if (!vp) return;

    requestAnimationFrame(() => {
      if (!center) {
        vp.scrollToIndex(this.currentIndex, 'smooth');
        return;
      }

      const itemSize = this.thumbItemSize;
      const viewportSize = vp.getViewportSize();
      const desired = this.currentIndex * itemSize - (viewportSize - itemSize) / 2;

      const contentSize = this.items.length * itemSize;
      const max = Math.max(0, contentSize - viewportSize);
      const target = Math.min(Math.max(0, desired), max);

      vp.scrollToOffset(target, 'smooth');
    });
  }

  get isFavorite(): boolean {
    return !!this.current?.favorite;
  }

  toggleFavorite(event: MouseEvent) {
    event.stopPropagation();

    const item = this.current;
    if (!item?.id) return;

    this.mediaService.toggleFavorite(item.id);
  }

  isPlaying = true;
  volume = 1;
  showVolume = false;

  pauseVideos() {
    this.videoPlayers?.forEach(v => v.nativeElement.pause());
    this.mainVideo?.nativeElement.pause();
    this.isPlaying = false;
  }

  togglePlay() {
    const video = this.mainVideo?.nativeElement;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        this.isPlaying = true;
        this.cdr.markForCheck();
      }).catch(() => {});
    } else {
      video.pause();
      this.isPlaying = false;
      this.cdr.markForCheck();
    }
  }

  toggleMute() {
    const video = this.mainVideo?.nativeElement;
    if (!video) return;

    if (video.muted || this.volume === 0) {
      const restore = this.lastVolumeBeforeMute > 0 ? this.lastVolumeBeforeMute : 1;
      this.volume = restore;
      video.muted = false;
      video.volume = restore;
    } else {
      this.lastVolumeBeforeMute = this.volume > 0 ? this.volume : 1;
      this.volume = 0;
      video.volume = 0;
      video.muted = true;
    }

    this.cdr.markForCheck();
  }

  changeVolume() {
    const video = this.mainVideo?.nativeElement;
    if (!video) return;

    const nextVolume = Math.max(0, Math.min(1, Number(this.volume)));
    this.volume = nextVolume;

    video.volume = nextVolume;
    video.muted = nextVolume === 0;

    if (nextVolume > 0) {
      this.lastVolumeBeforeMute = nextVolume;
    }

    this.cdr.markForCheck();
  }

  next() {
    this.pauseVideos();
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
      this.currentId = this.items[this.currentIndex]?.id ?? null;

      this.indexChange.emit(this.currentIndex);
      this.scrollToCurrentThumb();
      this.cdr.markForCheck();
      requestAnimationFrame(() => this.syncVideoPlayback());
    }
  }

  prev() {
    this.pauseVideos();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentId = this.items[this.currentIndex]?.id ?? null;

      this.indexChange.emit(this.currentIndex);
      this.scrollToCurrentThumb();
      this.cdr.markForCheck();
      requestAnimationFrame(() => this.syncVideoPlayback());
    }
  }

  select(index: number) {
    this.pauseVideos();

    this.currentIndex = index;
    this.currentId = this.items[index]?.id ?? null;

    this.indexChange.emit(this.currentIndex);
    this.scrollToCurrentThumb();
    this.cdr.markForCheck();
    requestAnimationFrame(() => this.syncVideoPlayback());
  }

  private mediaStartX = 0;
  private mediaStartY = 0;
  deltaX = 0;
  deltaY = 0;
  isDragging = false;

  transformStyle = 'translate(0px, 0px)';
  transitionStyle = 'transform .25s ease';

  onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    this.mediaStartX = touch.clientX;
    this.mediaStartY = touch.clientY;

    this.isDragging = true;
    this.deltaX = 0;
    this.deltaY = 0;

    this.transitionStyle = 'none';
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;

    const touch = event.touches[0];
    this.deltaX = touch.clientX - this.mediaStartX;
    this.deltaY = touch.clientY - this.mediaStartY;

    if (Math.abs(this.deltaX) > Math.abs(this.deltaY)) {
      this.transformStyle = `translate(${this.deltaX}px, 0)`;
    } else {
      this.transformStyle = `translate(0, ${this.deltaY}px)`;
    }
  }

  onTouchEnd() {
    if (!this.isDragging) return;

    const threshold = 90;
    this.transitionStyle = 'transform .25s ease';

    const isHorizontal = Math.abs(this.deltaX) > Math.abs(this.deltaY);

    if (isHorizontal) {
      if (this.deltaX < -threshold && this.currentIndex < this.items.length - 1) {
        this.swipeToNext();
        return;
      }

      if (this.deltaX > threshold && this.currentIndex > 0) {
        this.swipeToPrev();
        return;
      }
    } else {
      if (this.deltaY < -threshold) {
        this.swipeClose();
        return;
      }
    }

    this.snapBack();
  }

  private swipeToNext() {
    this.transformStyle = 'translate(-100%, 0)';

    setTimeout(() => {
      this.next();
      this.afterSwipeReset('fromRight');
    }, 250);
  }

  private swipeToPrev() {
    this.transformStyle = 'translate(100%, 0)';

    setTimeout(() => {
      this.prev();
      this.afterSwipeReset('fromLeft');
    }, 250);
  }

  private swipeClose() {
    this.transformStyle = 'translate(0, -100%)';
    setTimeout(() => {
      this.isDragging = false;
      this.deltaX = 0;
      this.deltaY = 0;
      this.overlayService.close();
    }, 250);
  }

  private afterSwipeReset(direction: 'fromLeft' | 'fromRight') {
    this.isDragging = false;
    this.deltaX = 0;
    this.deltaY = 0;

    this.transitionStyle = 'none';
    this.transformStyle = direction === 'fromLeft'
      ? 'translate(-100%, 0)'
      : 'translate(100%, 0)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.transitionStyle = 'transform .25s ease';
        this.transformStyle = 'translate(0, 0)';
        this.cdr.markForCheck();
        this.syncVideoPlayback();
      });
    });
  }

  private snapBack() {
    this.isDragging = false;
    this.deltaX = 0;
    this.deltaY = 0;

    this.transformStyle = 'translate(0, 0)';
    this.cdr.markForCheck();
  }

  copyPrompt(item: MediaItem) {
    if (!item?.prompt) return;

    navigator.clipboard.writeText(item.prompt);
    this.promptBridge.setMedia(item);
    this.overlayService.close();
  }

  trackByFn(index: number, item: MediaItem): string {
    return item.id || index.toString();
  }

  private emitIndexChangeSafely(index: number): void {
    Promise.resolve().then(() => {
      this.indexChange.emit(index);
    });
  }

  private syncVideoPlayback(): void {
    this.videoPlayers?.forEach(v => {
      const video = v.nativeElement;
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;

      if (this.autoplayEnabled) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    const main = this.mainVideo?.nativeElement;
    if (main) {
      main.defaultMuted = false;
      main.muted = this.volume === 0;
      main.volume = this.volume;

      if (this.autoplayEnabled) {
        main.play().then(() => {
          this.isPlaying = true;
          this.cdr.markForCheck();
        }).catch(() => {});
      } else {
        main.pause();
        this.isPlaying = false;
        this.cdr.markForCheck();
      }
    }
  }
}
