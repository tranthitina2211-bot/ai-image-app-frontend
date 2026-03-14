import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { OverlayAction } from '@models/overlay-action.model';
import { MediaItem } from '@models/media.model';
import { StackItem } from '@models/stack.model';

@Component({
  selector: 'app-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent {

  @Input() stackSize = 1;
  @Input() actions: OverlayAction[] = [];
  @Input() item!: MediaItem;
  @Input() openRight = false;

  @Output() actionClick = new EventEmitter<OverlayAction['id']>();

  menuOpen = false;

  constructor(private host: ElementRef<HTMLElement>) {}

  toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  handleClick(action: OverlayAction) {
    this.menuOpen = false;
    this.actionClick.emit(action.id);
  }

  isVisible(action: OverlayAction) {
    if (!action.visible) return true;
    return action.visible({ item: this.item, stackSize: this.stackSize });
  }

  // ✅ đóng NGAY khi nhấn xuống ở ngoài (chuột + touch + pen)
  @HostListener('document:pointerdown', ['$event'])
  onDocPointerDown(ev: PointerEvent) {
    if (!this.menuOpen) return;
    const target = ev.target as Node | null;
    if (!target) return;

    if (!this.host.nativeElement.contains(target)) {
      this.menuOpen = false;
    }
  }

  // ✅ fallback: nếu user giữ chuột và rê ra ngoài, cũng đóng luôn
  @HostListener('document:pointermove', ['$event'])
  onDocPointerMove(ev: PointerEvent) {
    if (!this.menuOpen) return;

    // chỉ xử lý khi đang giữ nút (mouse) hoặc đang drag pointer
    // (ev.buttons: 1 = left mouse button)
    if ((ev as any).buttons !== undefined && (ev as any).buttons === 0) return;

    const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
    if (!el) return;

    if (!this.host.nativeElement.contains(el)) {
      this.menuOpen = false;
    }
  }

  // ✅ ESC => đóng
  @HostListener('document:keydown.escape')
  onEsc() {
    if (!this.menuOpen) return;
    this.menuOpen = false;
  }
}
