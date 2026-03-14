import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';
import { FavoritesRoutingModule } from './favorites-routing.module';

import { FavoritesComponent } from './pages/favorites/favorites.component';
import { CollectionsComponent } from '@components/collections/collections.component';
import { CollectionDetailComponent } from '@components/collection-detail/collection-detail.component';

@NgModule({
  declarations: [
    FavoritesComponent,
    CollectionsComponent,
    CollectionDetailComponent
  ],
  imports: [
    CommonModule,
    FavoritesRoutingModule,
    SharedModule
  ]
})
export class FavoritesModule { }
