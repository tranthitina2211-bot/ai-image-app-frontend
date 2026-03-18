import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/create/create.component').then(
        (m) => m.CreateComponent
      ),
  },
  {
    path: 'gallery',
    loadComponent: () =>
      import('./pages/gallery/gallery.component').then(
        (m) => m.GalleryComponent
      ),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/history.component').then(
        (m) => m.HistoryComponent
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
