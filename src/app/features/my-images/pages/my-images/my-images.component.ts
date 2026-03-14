import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import {
  map,
  shareReplay,
  debounceTime,
  distinctUntilChanged,
  startWith,
  takeUntil
} from 'rxjs/operators';

import { MediaService } from '@services/media.service';
import { SettingsService } from '@services/settings.service';


import { MediaItem } from '@models/media.model';
import { OverlayContext } from '@models/overlay-payload.model';

import { groupByDay, sortMediaDesc, DayGroup } from 'src/app/shared/utils/group-by-day';

type Tab = 'all' | 'by-day';
type TypeFilter = 'all' | 'image' | 'video';

@Component({
  selector: 'app-my-images',
  templateUrl: './my-images.component.html',
  styleUrls: ['./my-images.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyImagesComponent implements OnInit, OnDestroy {
  readonly context: OverlayContext = 'my-images';
  private destroy$ = new Subject<void>();

  currentList: MediaItem[] = [];
  tab: Tab = 'all';
  isNearBottom = false;

  readonly selectedDayKey$ = new BehaviorSubject<string | null>(null);
  readonly query$ = new BehaviorSubject<string>('');
  readonly typeFilter$ = new BehaviorSubject<TypeFilter>('all');

  selectMode = false;
  selectedIds = new Set<string>();

  readonly gridSize$ = this.settingsService.settings$.pipe(
    map(settings => settings.gridSize),
    shareReplay(1)
  );

  constructor(
    private media: MediaService,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    combineLatest([
      this.all$,
      this.dayItems$,
      this.selectedDayKey$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([all, day, dayKey]) => {
        if (this.tab === 'all') {
          this.currentList = all;
        } else if (this.tab === 'by-day' && dayKey) {
          this.currentList = day;
        } else {
          this.currentList = [];
        }
      });

    document.body.classList.add('page-my-images');
    this.syncBodyScrollMode();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    document.body.classList.remove('page-my-images');
    document.body.classList.remove('page-has-cdk-scroll');
  }

  onNearBottomChange(v: boolean) {
    this.isNearBottom = v;
  }

  setQuery(v: string) {
    this.query$.next(v);
  }

  setTypeFilter(v: TypeFilter) {
    this.typeFilter$.next(v);
  }

  readonly allRaw$: Observable<MediaItem[]> = this.media.list$.pipe(
    map(list => list.filter(item => this.isVisibleInMyImages(item))),
    map(list => sortMediaDesc(list)),
    shareReplay(1)
  );

  readonly all$: Observable<MediaItem[]> = combineLatest([
    this.allRaw$,
    this.query$.pipe(
      startWith(''),
      debounceTime(200),
      distinctUntilChanged()
    ),
    this.typeFilter$
  ]).pipe(
    map(([list, q, tf]) => this.applyFilters(list, q, tf)),
    shareReplay(1)
  );

  readonly groups$: Observable<DayGroup[]> = this.all$.pipe(
    map(list => groupByDay(list)),
    shareReplay(1)
  );

  readonly dayItems$: Observable<MediaItem[]> = combineLatest([
    this.groups$,
    this.selectedDayKey$
  ]).pipe(
    map(([groups, key]) => {
      if (!key) return [];
      return groups.find(g => g.dayKey === key)?.items ?? [];
    }),
    shareReplay(1)
  );

  readonly currentList$: Observable<MediaItem[]> = combineLatest([
    this.all$,
    this.dayItems$,
    this.selectedDayKey$
  ]).pipe(
    map(([all, day, dayKey]) => {
      if (this.tab === 'all') return all;
      if (this.tab === 'by-day' && dayKey) return day;
      return [];
    }),
    shareReplay(1)
  );

  toggleSelectMode() {
    this.selectMode = !this.selectMode;

    if (!this.selectMode) {
      this.selectedIds = new Set<string>();
    }
  }

  onSelectionChange(next: Set<string>) {
    this.selectedIds = next;
  }

  bulkFavorite(value: boolean) {
    const items = this.selectedItemsFrom(this.currentList);

    items.forEach(it => {
      if (it.favorite !== value) {
        this.media.toggleFavorite(it.id);
      }
    });
  }

  bulkDelete() {
    const items = this.selectedItemsFrom(this.currentList);
    if (!items.length) return;

    const confirmBeforeDelete = this.settingsService.getSnapshot().confirmBeforeDelete;

    if (confirmBeforeDelete) {
      const ok = window.confirm(
        `Delete ${items.length} selected item(s)? This action cannot be undone.`
      );
      if (!ok) return;
    }

    items.forEach(it => this.media.remove(it.id));

    this.selectedIds = new Set<string>();
    this.selectMode = false;
  }

  setTab(t: Tab) {
    this.tab = t;
    this.selectedDayKey$.next(null);
    this.selectedIds = new Set<string>();
    this.selectMode = false;
    this.isNearBottom = false;
    this.syncBodyScrollMode();
  }

  openFolder(dayKey: string) {
    this.selectedDayKey$.next(dayKey);
    this.tab = 'by-day';
    this.isNearBottom = false;
    this.syncBodyScrollMode();
  }

  backToFolders() {
    this.selectedDayKey$.next(null);
    this.isNearBottom = false;
    this.syncBodyScrollMode();
  }

  trackByDay = (_: number, g: DayGroup) => g.dayKey;

  private selectedItemsFrom(list: MediaItem[]): MediaItem[] {
    return list.filter(x => this.selectedIds.has(x.id));
  }

  private syncBodyScrollMode(): void {
    const useCdk =
      this.tab === 'all' ||
      (this.tab === 'by-day' && !!this.selectedDayKey$.value);

    document.body.classList.toggle('page-has-cdk-scroll', useCdk);
  }

  private isVisibleInMyImages(item: MediaItem): boolean {
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

  private applyFilters(list: MediaItem[], query: string, tf: TypeFilter): MediaItem[] {
    const q = (query ?? '').trim().toLowerCase();

    return list.filter(it => {
      if (tf !== 'all' && it.type !== tf) return false;
      if (!q) return true;

      const prompt = (it.prompt ?? '').toLowerCase();
      const ratio = (it.ratio ?? '').toLowerCase();
      const seed = (it.seed ?? '').toString();

      return (
        prompt.includes(q) ||
        ratio.includes(q) ||
        seed.includes(q)
      );
    });
  }
}
