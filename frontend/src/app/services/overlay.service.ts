import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { OverlayPayload } from '@models/overlay-payload.model';
import { MediaItem } from '@models/media.model';

@Injectable({ providedIn: 'root' })
export class OverlayService {
  private _state = new BehaviorSubject<OverlayPayload | null>(null);
  state$ = this._state.asObservable();

  constructor() {}

  open(payload: OverlayPayload) {
    this._state.next(payload);
  }

  openList(
    data: MediaItem[],
    startIndex = 0,
    title?: string,
    context?: OverlayPayload['context']
  ) {
    this.open({ mode: 'list', data, startIndex, title, context });
  }

  close() {
    this._state.next(null);
  }

  get current(): OverlayPayload | null {
    return this._state.value;
  }

  get isOpen(): boolean {
    return !!this._state.value;
  }
}
