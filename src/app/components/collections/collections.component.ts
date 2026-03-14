import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { CollectionService } from '@services/collection.service';
import { Collection } from '@models/collection.model';
import { MediaService } from '@services/media.service';
import { MediaItem } from '@models/media.model';
import { MatDialog } from '@angular/material/dialog';
import { PromptDialogComponent } from '@components/prompt-dialog/prompt-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionsComponent {
  readonly collections$: Observable<Collection[]> = this.collectionService.collections$;
  readonly media$ = this.mediaService.list$;

  constructor(
    private collectionService: CollectionService,
    private mediaService: MediaService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  create(): void {
    const ref = this.dialog.open(PromptDialogComponent, {
      width: '420px',
      data: {
        title: 'Create collection',
        placeholder: 'Collection name',
        confirmText: 'Create'
      }
    });

    ref.afterClosed().subscribe((name?: string) => {
      if (!name) return;
      const created = this.collectionService.create(name);
      this.router.navigate(['/app/favorites/collections', created.id]);
    });
  }

  open(id: string): void {
    this.router.navigate(['/app/favorites/collections', id]);
  }

  rename(id: string, current: string): void {
    const ref = this.dialog.open(PromptDialogComponent, {
      width: '420px',
      data: {
        title: 'Rename collection',
        placeholder: 'Collection name',
        value: current,
        confirmText: 'Save'
      }
    });

    ref.afterClosed().subscribe((name?: string) => {
      if (!name) return;
      this.collectionService.rename(id, name);
    });
  }

  remove(id: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete collection',
        message: 'Are you sure you want to delete this collection?'
      }
    });

    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.collectionService.delete(id);
    });
  }

  getCover(col: Collection, media: MediaItem[]): MediaItem | null {
    const byId = new Map(media.map(x => [x.id, x]));
    for (const id of col.itemIds) {
      const found = byId.get(id);
      if (found) return found;
    }
    return null;
  }

  trackById(_: number, item: Collection): string {
    return item.id;
  }
}
