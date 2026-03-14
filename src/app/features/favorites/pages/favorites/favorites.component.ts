import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Observable, BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { map, shareReplay, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

import { MediaService } from '@services/media.service';
import { MediaItem } from '@models/media.model';
import { OverlayContext } from '@models/overlay-payload.model';

import { sortMediaDesc } from 'src/app/shared/utils/group-by-day';

type TypeFilter = 'all' | 'image' | 'video';
type FavoritesTab = 'all' | 'collections';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesComponent implements OnInit, OnDestroy {
  readonly context: OverlayContext = 'favorites';
  private destroy$ = new Subject<void>();

  currentList: MediaItem[] = [];
  readonly tab$ = new BehaviorSubject<FavoritesTab>('all');
  isNearBottom = false;

  constructor(
    private media: MediaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const tab = params.get('tab');
        const safeTab: FavoritesTab =
          tab === 'collections' ? 'collections' : 'all';

        this.tab$.next(safeTab);
        this.isNearBottom = false;
        this.syncBodyScrollMode(safeTab);
      });

    this.fav$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => this.currentList = list);

    document.body.classList.add('page-favorites');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.classList.remove('page-favorites');
    document.body.classList.remove('page-has-cdk-scroll');
  }

  onNearBottomChange(v: boolean) {
    this.isNearBottom = v;
  }

  setTab(v: FavoritesTab) {
    this.tab$.next(v);
    this.isNearBottom = false;
    this.syncBodyScrollMode(v);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: v },
      queryParamsHandling: 'merge'
    });
  }

  readonly query$ = new BehaviorSubject<string>('');
  readonly typeFilter$ = new BehaviorSubject<TypeFilter>('all');

  setQuery(v: string) { this.query$.next(v); }
  setTypeFilter(v: TypeFilter) { this.typeFilter$.next(v); }

  readonly favRaw$: Observable<MediaItem[]> = this.media.list$.pipe(
    map(list => (list ?? []).filter(x => x.favorite === true)),
    map(list => sortMediaDesc(list)),
    shareReplay(1)
  );

  readonly fav$: Observable<MediaItem[]> = combineLatest([
    this.favRaw$,
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

  private syncBodyScrollMode(tab: FavoritesTab): void {
    document.body.classList.toggle('page-has-cdk-scroll', tab === 'all');
  }

  private applyFilters(list: MediaItem[], query: string, tf: TypeFilter): MediaItem[] {
    const q = (query ?? '').trim().toLowerCase();

    return (list ?? []).filter(it => {
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
