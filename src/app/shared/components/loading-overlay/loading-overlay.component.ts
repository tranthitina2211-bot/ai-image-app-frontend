import { Component } from '@angular/core';
import { LoadingOverlayService } from '@services/loading-overlay.service';

@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss']
})
export class LoadingOverlayComponent {
  readonly state$ = this.loadingOverlay.state$;

  constructor(private readonly loadingOverlay: LoadingOverlayService) {}
}
