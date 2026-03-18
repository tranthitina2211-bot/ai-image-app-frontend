import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { CollectionDetailComponent } from '@components/collection-detail/collection-detail.component';

const routes: Routes = [
  {
    path: '',
    component: FavoritesComponent
  },
  {
    path: 'collections/:id',
    component: CollectionDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FavoritesRoutingModule { }
