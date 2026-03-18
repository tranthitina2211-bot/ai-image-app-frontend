import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  SimpleChanges,
  OnChanges,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { MediaService } from '@services/media.service';
import { OverlayService } from '@services/overlay.service';
import { GenerateService } from 'src/app/core/generate/generate.service';

import { MediaItem } from '@models/media.model';
import { OverlayContext } from '@models/overlay-payload.model';
import { CdkDragMove, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

type GridSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-grid-container',
  templateUrl: './grid-container.component.html',
  styleUrls: ['./grid-container.component.scss']
})
export class GridContainerComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() selectMode = false;
  @Input() selectedIds: Set<string> = new Set<string>();
  @Output() selectionChange = new EventEmitter<Set<string>>();
  @Output() nearBottomChange = new EventEmitter<boolean>();

  @Input() context!: OverlayContext;
  @Input() view: 'stack' | 'list' = 'stack';
  @Input() items: MediaItem[] | null = null;
  @Input() gridSize: GridSize = 'medium';

  @ViewChild(CdkVirtualScrollViewport, { static: false })
  viewport?: CdkVirtualScrollViewport;

  @ViewChild('listHost', { static: false })
  listHostRef?: ElementRef<HTMLElement>;

  isNearBottom = false;
  private readonly nearBottomThreshold = 96;

  stacks: MediaItem[][] = [];
  list: MediaItem[] = [];

  private destroy$ = new Subject<void>();
  private ro?: ResizeObserver;

  private rafLock = false;
  hoveredTargetId: string | null = null;
  mergingOutId: string | null = null;
  mergingInId: string | null = null;

  cols = 5;
  rowSizePx = 320;
  rowGapPx = 14;
  private readonly rowPadY = 16;
  vRows: MediaItem[][] = [];

  trackRow = (i: number) => i;
  trackByItem = (_: number, it: MediaItem) => it.id;
  trackByStack = (_: number, stack: MediaItem[]) => stack?.[0]?.id_stack ?? _;

  constructor(
    private mediaService: MediaService,
    private overlay: OverlayService,
    private generate: GenerateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.view === 'list' && this.items !== null) {
      this.list = this.sortList(this.items ?? []);
      this.recomputeLayout();
      setTimeout(() => this.onViewportScrolled());
      return;
    }

    this.mediaService.list$
      .pipe(takeUntil(this.destroy$))
      .subscribe((list: MediaItem[]) => {
        if (this.view === 'stack') {
          this.stacks = this.groupByStack(list);
          this.refreshView();
          return;
        }

        const src = this.items ?? list;
        this.list = this.sortList(src);
        this.recomputeLayout();
        this.refreshView();
        setTimeout(() => this.onViewportScrolled());
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.setupResizeObserverIfNeeded());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['view'] && this.view === 'list') {
      setTimeout(() => this.setupResizeObserverIfNeeded());
    }

    if (this.view === 'list' && (changes['items'] || changes['gridSize'])) {
      this.list = this.sortList(this.items ?? []);
      this.recomputeLayout();
      this.refreshView();
      setTimeout(() => this.onViewportScrolled());
    }
  }

  ngOnDestroy() {
    this.ro?.disconnect();
    this.nearBottomChange.emit(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private refreshView() {
    try {
      this.cdr.detectChanges();
    } catch {}
  }

  private getGapByGridSize(size: GridSize): number {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 16;
      case 'medium':
      default:
        return 14;
    }
  }

  private computeCols(w: number): number {
    if (this.gridSize === 'small') {
      if (w < 520) return 2;
      if (w < 900) return 3;
      if (w < 1240) return 4;
      if (w < 1600) return 5;
      return 6;
    }

    if (this.gridSize === 'large') {
      if (w < 680) return 1;
      if (w < 1024) return 2;
      if (w < 1440) return 3;
      return 4;
    }

    if (w < 520) return 2;
    if (w < 900) return 3;
    if (w < 1240) return 4;
    if (w < 1600) return 5;
    return 6;
  }

  private recomputeRowSize(hostWidth: number): void {
    const usable = Math.max(0, hostWidth - 8);
    const c = Math.max(1, this.cols);
    const totalGapX = this.rowGapPx * (c - 1);
    const cardW = (usable - totalGapX) / c;
    const cardH = cardW;
    const rowH = cardH + this.rowGapPx + this.rowPadY;
    this.rowSizePx = Math.max(120, Math.round(rowH));
  }

  private rebuildRows(): void {
    const out: MediaItem[][] = [];
    const c = Math.max(1, this.cols);
    const src = this.list ?? [];

    for (let i = 0; i < src.length; i += c) {
      out.push(src.slice(i, i + c));
    }

    this.vRows = out;
  }

  private recomputeLayout(): void {
    const hostWidth = this.listHostRef?.nativeElement?.clientWidth ?? window.innerWidth;
    this.rowGapPx = this.getGapByGridSize(this.gridSize);
    this.cols = this.computeCols(hostWidth);
    this.recomputeRowSize(hostWidth);
    this.rebuildRows();
  }

  private setupResizeObserverIfNeeded(): void {
    if (this.view !== 'list') return;

    const el = this.listHostRef?.nativeElement;
    if (!el) return;

    this.ro?.disconnect();

    this.ro = new ResizeObserver(() => {
      this.recomputeLayout();
      this.refreshView();
      setTimeout(() => this.onViewportScrolled());
    });

    this.ro.observe(el);

    this.recomputeLayout();
    this.refreshView();
    setTimeout(() => this.onViewportScrolled());
  }

  private sortList(list: MediaItem[]): MediaItem[] {
    return [...list].sort((a, b) => {
      const ta = (a.createdAt ? new Date(a.createdAt as any).getTime() : 0) || 0;
      const tb = (b.createdAt ? new Date(b.createdAt as any).getTime() : 0) || 0;
      if (tb !== ta) return tb - ta;

      const oa = a.order_in_board ?? 0;
      const ob = b.order_in_board ?? 0;
      return ob - oa;
    });
  }

  onCardClick(item: MediaItem) {
    if (this.selectMode) {
      const next = new Set(this.selectedIds);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);

      this.selectionChange.emit(next);
      return;
    }

    const index = this.list.findIndex(x => x.id === item.id);
    if (index < 0) return;

    this.overlay.openList(this.list, index, undefined, this.context);
  }

  onLiveReorder(ev: CdkDragMove<MediaItem[]>) {
    if (this.rafLock) return;
    this.rafLock = true;

    requestAnimationFrame(() => {
      this.rafLock = false;

      const p = ev.pointerPosition;
      const el = document.elementFromPoint(p.x, p.y) as HTMLElement | null;
      if (!el) return;

      const host = el.closest('app-board-item[data-stack-id]') as HTMLElement | null;
      if (!host) return;

      const targetStackId = host.getAttribute('data-stack-id');
      if (!targetStackId) return;

      const draggedStack = ev.source.data;
      const draggedStackId = draggedStack?.at(0)?.id_stack;
      if (!draggedStackId) return;

      if (targetStackId === draggedStackId) return;

      const fromIndex = this.stacks.findIndex(s => s.at(0)?.id_stack === draggedStackId);
      const toIndex = this.stacks.findIndex(s => s.at(0)?.id_stack === targetStackId);

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
      moveItemInArray(this.stacks, fromIndex, toIndex);
    });
  }

  onDragEnded() {}

  onDragHover(stackId: string | null) {
    this.hoveredTargetId = stackId;
  }

  onMergeDrop(ev: { source: MediaItem[]; targetStackId: string }) {
    const sourceId = ev.source[0]?.id_stack;
    const targetId = ev.targetStackId;
    if (!sourceId || !targetId || sourceId === targetId) return;

    this.mergingOutId = sourceId;
    this.mergingInId = targetId;

    this.mediaService.mergeStacks(ev.source, targetId);

    setTimeout(() => {
      this.mergingOutId = null;
      this.mergingInId = null;
      this.hoveredTargetId = null;
    }, 320);
  }

  onCancel(item: MediaItem) {
    this.generate.cancel(item);
  }

  private groupByStack(list: MediaItem[]): MediaItem[][] {
    const map = new Map<string, MediaItem[]>();

    list.forEach(item => {
      if (!map.has(item.id_stack)) map.set(item.id_stack, []);
      map.get(item.id_stack)!.push(item);
    });

    map.forEach(stack => {
      stack.sort((a, b) => {
        const ag = a.ghostOf ? 1 : 0;
        const bg = b.ghostOf ? 1 : 0;
        if (ag !== bg) return bg - ag;

        const ap = a.status === 'processing' ? 1 : 0;
        const bp = b.status === 'processing' ? 1 : 0;
        if (ap !== bp) return bp - ap;

        return a.order_in_stack - b.order_in_stack;
      });
    });

    return Array.from(map.values());
  }

  onSelect(event: { items: MediaItem[]; rect: DOMRect }) {
    this.overlay.open({
      mode: 'stack',
      context: this.context,
      data: event.items,
      rect: event.rect
    });
  }

  private emitNearBottom(next: boolean): void {
    if (this.isNearBottom === next) return;
    this.isNearBottom = next;
    this.nearBottomChange.emit(next);
  }

  onViewportScrolled(): void {
    if (this.view !== 'list' || !this.viewport) return;

    const bottomOffset = this.viewport.measureScrollOffset('bottom');
    this.emitNearBottom(bottomOffset <= this.nearBottomThreshold);
  }
}
