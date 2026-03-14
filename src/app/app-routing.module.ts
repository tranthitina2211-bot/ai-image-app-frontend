import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FullComponent } from './layouts/full/full.component';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/landing/landing.module').then(
            (m) => m.LandingModule
          ),
      },
    ],
  },
  {
    path: 'auth',
    component: FullComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/auth/auth.module').then((m) => m.AuthModule)
      }
    ]
  },
  {
    path: 'app',
    component: FullComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'create',
        loadChildren: () =>
          import('./features/create/create.module').then(m => m.CreateModule)
      },
      {
        path: 'my-images',
        loadChildren: () =>
          import('./features/my-images/my-images.module').then(m => m.MyImagesModule)
      },
      {
        path: 'favorites',
        loadChildren: () =>
          import('./features/favorites/favorites.module').then(m => m.FavoritesModule)
      },
      {
        path: 'presets',
        loadChildren: () =>
          import('./features/presets/presets.module').then(m => m.PresetsModule)
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.module').then(m => m.SettingsModule)
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notifications/notifications.module').then(m => m.NotificationsModule)
      },
      {
        path: 'billing',
        loadChildren: () =>
          import('./features/billing/billing.module').then(m => m.BillingModule)
      },
      {
        path: 'account',
        loadChildren: () =>
          import('./features/account/account.module').then(m => m.AccountModule)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'create'
      }
    ],
  },
  {
    path: '404',
    component: FullComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/error/error.module').then((m) => m.ErrorModule)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
