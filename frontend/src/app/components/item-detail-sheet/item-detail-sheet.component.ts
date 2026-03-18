import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MediaItem } from '@models/media.model';

@Component({
  selector: 'app-item-detail-sheet',
  templateUrl: './item-detail-sheet.component.html',
  styleUrls: ['./item-detail-sheet.component.scss']
})
export class ItemDetailSheetComponent {
  @Input() item!: MediaItem | null;
  @Output() closeSheet = new EventEmitter<void>();
  @Output() copyPrompt = new EventEmitter<void>();

  close(): void {
    this.closeSheet.emit();
  }

  onCopyPrompt(): void {
    this.copyPrompt.emit();
  }

  get createdText(): string {
    if (!this.item?.createdAt) return '—';

    const d = new Date(this.item.createdAt);
    if (Number.isNaN(d.getTime())) return '—';

    return d.toLocaleString();
  }

  get resolutionText(): string {
    return this.item?.resolution?.trim() || '—';
  }

  get ratioText(): string {
    return this.item?.ratio?.trim() || '—';
  }

  get promptText(): string {
    return this.item?.prompt?.trim() || 'No prompt';
  }

  get seedText(): string {
    if (this.item?.seed === null || this.item?.seed === undefined) return '—';
    return String(this.item.seed);
  }

  get statusText(): string {
    return this.item?.status || '—';
  }

  get typeText(): string {
    return this.item?.type || '—';
  }

  get progressText(): string {
    if (this.item?.progress === null || this.item?.progress === undefined) return '—';
    return `${this.item.progress}%`;
  }

  get stackText(): string {
    return this.item?.id_stack || '—';
  }

  get parentText(): string {
    return this.item?.parentId || '—';
  }

  get jobText(): string {
    return this.item?.jobId || '—';
  }

  get isProcessing(): boolean {
    return this.item?.status === 'processing';
  }
}
