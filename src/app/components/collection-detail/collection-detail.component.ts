import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';

import { CollectionService } from '@services/collection.service';
import { MediaService } from '@services/media.service';
import { OverlayService } from '@services/overlay.service';

import { MediaItem } from '@models/media.model';
import { OverlayContext } from '@models/overlay-payload.model';

import { PromptDialogComponent } from '@components/prompt-dialog/prompt-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-collection-detail',
  templateUrl: './collection-detail.component.html',
  styleUrls: ['./collection-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionDetailComponent {
  readonly context: OverlayContext = 'collection';

  private readonly dialogBaseConfig = {
    maxWidth: 'calc(100vw - 24px)',
    panelClass: 'app-light-dialog-panel',
    backdropClass: 'app-light-dialog-backdrop',
    autoFocus: false,
    restoreFocus: false
  };

  readonly vm$ = combineLatest([
    this.route.paramMap,
    this.collectionService.collections$,
    this.mediaService.list$
  ]).pipe(
    map(([params, collections, media]) => {
      const id = params.get('id') ?? '';
      const collection = collections.find(x => x.id === id) ?? null;
      const byId = new Map(media.map(x => [x.id, x]));
      const items = (collection?.itemIds ?? [])
        .map(itemId => byId.get(itemId))
        .filter(Boolean) as MediaItem[];

      return {
        id,
        collection,
        items
      };
    })
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private collectionService: CollectionService,
    private mediaService: MediaService,
    private overlayService: OverlayService,
    private dialog: MatDialog
  ) {}

  back(): void {
    this.router.navigate(['/app/favorites'], {
      queryParams: { tab: 'collections' }
    });
  }

  rename(id: string, current: string): void {
    const ref = this.dialog.open(PromptDialogComponent, {
      ...this.dialogBaseConfig,
      width: '460px',
      data: {
        title: 'Rename collection',
        placeholder: 'Collection name',
        value: current,
        confirmText: 'Save',
        cancelText: 'Cancel'
      }
    });

    ref.afterClosed().subscribe((name?: string) => {
      if (!name) return;
      this.collectionService.rename(id, name);
    });
  }

  delete(id: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      ...this.dialogBaseConfig,
      width: '420px',
      data: {
        title: 'Delete collection',
        message: 'Are you sure you want to delete this collection?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.collectionService.delete(id);
      this.back();
    });
  }

  removeItem(collectionId: string, itemId: string): void {
    this.collectionService.removeItem(collectionId, itemId);
  }

  openOverlay(items: MediaItem[], startIndex: number): void {
    this.overlayService.open({
      mode: 'list',
      context: 'collection',
      data: items,
      startIndex
    });
  }

  drop(event: CdkDragDrop<MediaItem[]>, collectionId: string): void {
    if (event.previousIndex === event.currentIndex) return;
    this.collectionService.reorder(collectionId, event.previousIndex, event.currentIndex);
  }

  trackById(_: number, item: MediaItem): string {
    return item.id;
  }
}
