import { Component } from '@angular/core';
import { AuthStateService } from '@services/auth-state.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent {
  constructor(public readonly authState: AuthStateService) {}
}
