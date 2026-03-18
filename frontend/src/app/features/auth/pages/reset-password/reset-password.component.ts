import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  password = '';
  confirmPassword = '';

  constructor(private readonly router: Router) {}

  submit(): void {
    this.router.navigateByUrl('/auth/login');
  }
}
