import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Collection } from '@models/collection.model';

export interface CollectionPickerDialogData {
  title?: string;
  collections: Collection[];
  selectedItemIds?: string[];
}

@Component({
  selector: 'app-collection-picker-dialog',
  templateUrl: './collection-picker-dialog.component.html',
  styleUrls: ['./collection-picker-dialog.component.scss']
})
export class CollectionPickerDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<CollectionPickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CollectionPickerDialogData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  choose(collectionId: string): void {
    this.dialogRef.close({ type: 'pick', collectionId });
  }

  createNew(): void {
    this.dialogRef.close({ type: 'create' });
  }

  trackById(_: number, item: Collection): string {
    return item.id;
  }
  isIncluded(c: Collection): boolean {
    const ids = this.data.selectedItemIds ?? [];
    if (!ids.length) return false;

    return ids.some(id => c.itemIds.includes(id));
  }
}
