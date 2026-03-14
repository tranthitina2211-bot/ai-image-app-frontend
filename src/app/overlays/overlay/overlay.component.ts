import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

import { OverlayService } from '@services/overlay.service';
import { MediaService } from '@services/media.service';
import { SettingsService } from '@services/settings.service';
import { GenerateService } from 'src/app/core/generate/generate.service';
import { CollectionService } from '@services/collection.service';
import { PromptBridgeService } from '@services/promptbridge.service';

import { OverlayPayload } from '@models/overlay-payload.model';
import { OverlayAction } from '@models/overlay-action.model';
import { MediaItem } from '@models/media.model';

import { getOverlayActions } from './context/overlay-actions.factory';

import { MatDialog } from '@angular/material/dialog';
import { CollectionPickerDialogComponent } from '@components/collection-picker-dialog/collection-picker-dialog.component';
import { PromptDialogComponent } from '@components/prompt-dialog/prompt-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent implements OnInit, OnDestroy {
  @ViewChild('content') contentRef!: ElementRef<HTMLElement>;

  payload: OverlayPayload | null = null;
  actions: OverlayAction[] = [];
  private lastRect?: DOMRect;

  stack: MediaItem[] = [];
  stackId: string | null = null;
  currentItemId: string | null = null;
  currentIndex = 0;

  detailSheetOpen = false;
  detailItem: MediaItem | null = null;

  private destroy$ = new Subject<void>();
  private stopBindStack$ = new Subject<void>();

  constructor(
    private overlayService: OverlayService,
    private mediaService: MediaService,
    private settingsService: SettingsService,
    private generateService: GenerateService,
    private collectionService: CollectionService,
    private promptBridge: PromptBridgeService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.overlayService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        this.payload = payload;
        this.stopBindStack$.next();

        if (payload) {
          document.body.classList.add('overlay-open');
          this.actions = getOverlayActions(payload.context);
          this.currentIndex =
            payload.mode === 'list'
              ? Math.max(0, Math.min(payload.startIndex ?? 0, (payload.data?.length ?? 1) - 1))
              : 0;

          this.detailSheetOpen = false;
          this.detailItem = null;

          if (payload.mode === 'list') {
            this.stackId = null;
            this.stack = payload.data ?? [];

            const current = this.stack[this.currentIndex];
            this.currentItemId = current?.id ?? null;

            this.bindLiveList();
          } else {
            const first = payload.data?.[0] as MediaItem | undefined;
            this.stackId = first?.id_stack ?? null;

            this.stack = payload.data ?? [];
            this.currentItemId = this.stack[this.currentIndex]?.id ?? null;

            this.bindLiveStack();
          }
        } else {
          document.body.classList.remove('overlay-open');
          this.stack = [];
          this.stackId = null;
          this.detailSheetOpen = false;
          this.detailItem = null;
        }

        if (payload?.rect) {
          this.lastRect = payload.rect;
          requestAnimationFrame(() => this.playZoomFromCard(payload.rect!));
        }
      });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('overlay-open');
    this.stopBindStack$.next();
    this.stopBindStack$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get current(): MediaItem | null {
    return this.stack?.[this.currentIndex] ?? this.stack?.[0] ?? null;
  }

  syncCurrentItemId(): void {
    this.currentItemId = this.current?.id ?? null;
    if (this.detailSheetOpen) {
      this.detailItem = this.current;
    }
  }

  private bindLiveList() {
    const sourceItems = this.payload?.data ?? [];
    const sourceIds = sourceItems.map(x => x.id);
    const orderMap = new Map(sourceIds.map((id, index) => [id, index] as const));
    const hasFixedSource = sourceIds.length > 0;

    this.mediaService.list$
      .pipe(takeUntil(this.stopBindStack$), takeUntil(this.destroy$))
      .subscribe(list => {
        let next = list.filter(x => this.isVisibleInOverlayList(x));

        if (hasFixedSource) {
          next = next.filter(x => orderMap.has(x.id));
          next.sort((a, b) => (orderMap.get(a.id)! - orderMap.get(b.id)!));
        } else {
          next.sort((a, b) => (b.order_in_board ?? 0) - (a.order_in_board ?? 0));
        }

        this.stack = next;

        if (!next.length) {
          this.close();
          return;
        }

        this.applyOverlayState(() => {
          this.stack = next;

          if (this.currentItemId) {
            const idx = next.findIndex(x => x.id === this.currentItemId);

            if (idx >= 0) {
              this.currentIndex = idx;
            } else {
              if (this.currentIndex >= next.length) {
                this.currentIndex = next.length - 1;
              }
              this.currentItemId = next[this.currentIndex]?.id ?? null;
            }
          } else {
            this.currentIndex = Math.max(0, Math.min(this.currentIndex, next.length - 1));
            this.currentItemId = next[this.currentIndex]?.id ?? null;
          }

          if (this.detailSheetOpen) {
            this.detailItem = this.current;
          }
        });
      });
  }

  private bindLiveStack() {
    const id = this.stackId;
    if (!id) {
      this.stack = this.payload?.data ?? [];
      return;
    }

    this.mediaService.list$
      .pipe(takeUntil(this.stopBindStack$), takeUntil(this.destroy$))
      .subscribe(list => {
        const next = list
          .filter(x => x.id_stack === id)
          .slice()
          .sort((a, b) => a.order_in_stack - b.order_in_stack);

        this.stack = next;

        if (!next.length) {
          this.close();
          return;
        }

        this.applyOverlayState(() => {
          this.stack = next;

          if (this.currentIndex > this.stack.length - 1) {
            this.currentIndex = Math.max(0, this.stack.length - 1);
          }

          this.currentItemId = this.stack[this.currentIndex]?.id ?? null;

          if (this.detailSheetOpen) {
            this.detailItem = this.current;
          }
        });
      });
  }

  private isVisibleInOverlayList(item: MediaItem): boolean {
    if (
      item.status === 'processing' &&
      !!item.jobId &&
      !item.ghostOf &&
      !!item.parentId
    ) {
      return false;
    }

    return true;
  }

  onCancel(item: MediaItem) {
    this.generateService.cancel(item);
  }

  openDetailSheet(item: MediaItem): void {
    this.detailItem = item;
    this.detailSheetOpen = true;
  }

  closeDetailSheet(): void {
    this.detailSheetOpen = false;
    this.detailItem = null;
  }

  async copyPromptFromSheet(): Promise<void> {
    const text = (this.detailItem?.prompt ?? this.currentPreset?.prompt ?? '').trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  }

  private confirmDelete(clicked: MediaItem): void {
    const confirmBeforeDelete = this.settingsService.getSnapshot().confirmBeforeDelete;

    if (!confirmBeforeDelete) {
      this.performDelete(clicked);
      return;
    }

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      autoFocus: false,
      restoreFocus: false,
      data: {
        title: 'Delete item',
        message: 'Are you sure you want to delete this item?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.performDelete(clicked);
    });
  }

  private performDelete(clicked: MediaItem): void {
    const stackId = clicked.id_stack;
    const beforeCount = this.mediaService.snapshot().filter(x => x.id_stack === stackId).length;

    if (clicked.status === 'processing') {
      this.generateService.cancel(clicked);
      if (beforeCount <= 1) this.close();
      return;
    }

    this.mediaService.remove(clicked.id);

    const afterCount = this.mediaService.snapshot().filter(x => x.id_stack === stackId).length;
    if (beforeCount <= 1 || afterCount === 0) {
      this.close();
      return;
    }

    const after = this.mediaService.snapshot()
      .filter(x => x.id_stack === stackId)
      .sort((a, b) => a.order_in_stack - b.order_in_stack);

    if (this.currentIndex >= after.length) this.currentIndex = after.length - 1;
    this.syncCurrentItemId();
  }

  private downloadItem(item: MediaItem): void {
    if (!item.url) return;

    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.type === 'video' ? 'video.mp4' : 'image.jpg';
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  }

  private openAddToCollection(itemId: string): void {
    const list = this.collectionService.snapshot();

    const pickerRef = this.dialog.open(CollectionPickerDialogComponent, {
      width: '460px',
      data: {
        title: 'Add to collection',
        collections: list,
        selectedItemIds: [itemId]
      }
    });

    pickerRef.afterClosed().subscribe((result?: { type: 'pick' | 'create'; collectionId?: string }) => {
      if (!result) return;

      if (result.type === 'pick' && result.collectionId) {
        this.collectionService.addItems(result.collectionId, [itemId]);
        return;
      }

      if (result.type === 'create') {
        const createRef = this.dialog.open(PromptDialogComponent, {
          width: '420px',
          data: {
            title: 'Create collection',
            placeholder: 'Collection name',
            confirmText: 'Create'
          }
        });

        createRef.afterClosed().subscribe((name?: string) => {
          if (!name) return;
          const created = this.collectionService.create(name);
          this.collectionService.addItems(created.id, [itemId]);
        });
      }
    });
  }

  private getBaseSuccessInStack(cur: MediaItem): MediaItem | null {
    if (cur.status === 'success' && !cur.ghostOf) return cur;

    const list = this.mediaService.snapshot()
      .filter(x => x.id_stack === cur.id_stack && x.status === 'success' && !x.ghostOf)
      .sort((a, b) => a.order_in_stack - b.order_in_stack);

    if (!list.length) return null;

    if (cur.parentId) {
      const parent = list.find(x => x.id === cur.parentId);
      if (parent) return parent;
    }

    return list[list.length - 1];
  }

  private usePresetFromOverlay(): void {
    const preset = this.currentPreset;
    if (!preset) return;

    this.promptBridge.setValue({
      source: 'preset',
      prompt: preset.prompt ?? '',
      type: preset.type,
      ratio: preset.ratio,
      seed: preset.seed,
      presetId: preset.id,
      presetName: preset.name
    });

    this.close();
    this.router.navigate(['/app/create']);
  }

  async onActionClick(ev: { actionId: string; item: MediaItem }): Promise<void> {
    const actionId = ev.actionId;
    const clicked = ev.item;
    if (!clicked) return;

    if (actionId === 'copy-prompt') {
      const text = ((this.payload?.context === 'presets'
            ? this.currentPreset?.prompt
            : clicked.prompt) ?? '').trim();

      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      return;
    }

    if (actionId === 'use-preset') {
      this.usePresetFromOverlay();
      return;
    }

    if (actionId === 'toggle-favorite') {
      this.mediaService.toggleFavorite(clicked.id);
      return;
    }

    if (actionId === 'add-to-collection') {
      this.openAddToCollection(clicked.id);
      return;
    }

    if (actionId === 'view-detail') {
      this.openDetailSheet(clicked);
      return;
    }

    if (actionId === 'delete') {
      this.confirmDelete(clicked);
      return;
    }

    if (actionId === 'download') {
      this.downloadItem(clicked);
      return;
    }

    const base = this.getBaseSuccessInStack(clicked);
    if (!base) return;

    switch (actionId) {
      case 'variation':
        this.generateService.variation(base);
        break;

      case 'upscale':
        this.generateService.upscale(base);
        break;

      case 'image-to-video':
        if (base.type === 'image') this.generateService.imageToVideo(base);
        break;

      case 'drop-out': {
          const stackItems = this.mediaService.snapshot()
            .filter(x => x.id_stack === clicked.id_stack)
            .sort((a, b) => a.order_in_stack - b.order_in_stack);

          // Nếu chỉ có 1 item thì không cần drop-out
          if (stackItems.length <= 1) {
            this.close();
            break;
          }

          this.mediaService.dropOutFromStack(clicked.id);

          // Overlay stack mode: sau khi tách thì item hiện tại không còn thuộc stack cũ nữa
          // nên chuyển focus sang item kế tiếp trong stack cũ nếu còn
          const nextStack = this.mediaService.snapshot()
            .filter(x => x.id_stack === clicked.id_stack)
            .sort((a, b) => a.order_in_stack - b.order_in_stack);

          if (!nextStack.length) {
            this.close();
            break;
          }

          const nextIndex = Math.min(this.currentIndex, nextStack.length - 1);
          this.currentIndex = nextIndex;
          this.currentItemId = nextStack[nextIndex]?.id ?? null;

          if (this.detailSheetOpen) {
            this.detailItem = this.current;
          }

          break;
        }

      default:
        console.warn('Unknown action:', actionId);
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.dialog.openDialogs.length > 0) {
      return;
    }
    if (this.detailSheetOpen) {
      this.closeDetailSheet();
      return;
    }
    this.close();
  }

  close(): void {
    this.detailSheetOpen = false;
    this.detailItem = null;

    if (!this.lastRect) {
      this.overlayService.close();
      return;
    }

    const content = this.contentRef.nativeElement;
    const overlayRect = content.getBoundingClientRect();

    const scaleX = this.lastRect.width / overlayRect.width;
    const scaleY = this.lastRect.height / overlayRect.height;

    const translateX = this.lastRect.left - overlayRect.left;
    const translateY = this.lastRect.top - overlayRect.top;

    content.style.transition = 'transform .3s ease-in';
    content.style.transform = `
      translate(${translateX}px, ${translateY}px)
      scale(${scaleX}, ${scaleY})
    `;

    setTimeout(() => {
      this.overlayService.close();
    }, 300);
  }

  private playZoomFromCard(rect: DOMRect): void {
    const content = this.contentRef?.nativeElement;
    if (!content) return;

    const overlayRect = content.getBoundingClientRect();

    const scaleX = rect.width / overlayRect.width;
    const scaleY = rect.height / overlayRect.height;

    const translateX = rect.left - overlayRect.left;
    const translateY = rect.top - overlayRect.top;

    content.style.transform = `
      translate(${translateX}px, ${translateY}px)
      scale(${scaleX}, ${scaleY})
    `;

    content.getBoundingClientRect();

    content.style.transition = 'transform .3s ease-out';
    content.style.transform = 'translate(0,0) scale(1)';
  }

  get currentPreset() {
    if (this.payload?.context !== 'presets') return this.payload?.preset ?? null;

    const presets = this.payload?.presets ?? [];
    return presets[this.currentIndex] ?? this.payload?.preset ?? null;
  }

  get overlayTitle(): string {
    if (this.payload?.context === 'presets') {
      return this.currentPreset?.name ?? this.payload?.title ?? '';
    }
    return this.payload?.title ?? '';
  }

  private applyOverlayState(fn: () => void): void {
    queueMicrotask(() => {
      fn();
    });
  }
}
