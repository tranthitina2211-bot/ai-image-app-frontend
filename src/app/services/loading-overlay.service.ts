import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LoadingOverlayState {
  visible: boolean;
  message: string;
  detail?: string;
}

@Injectable({ providedIn: 'root' })
export class LoadingOverlayService {
  private readonly stateSubject = new BehaviorSubject<LoadingOverlayState>({
    visible: false,
    message: ''
  });

  readonly state$ = this.stateSubject.asObservable();

  show(message: string, detail?: string): void {
    this.stateSubject.next({ visible: true, message, detail });
  }

  hide(): void {
    this.stateSubject.next({ visible: false, message: '', detail: undefined });
  }
}
