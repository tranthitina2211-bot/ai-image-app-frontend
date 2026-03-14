import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '@services/auth-state.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.isLoggedIn && authState.token) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { redirect: state.url }
  });
};
