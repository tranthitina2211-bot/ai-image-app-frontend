import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyImagesComponent } from './pages/my-images/my-images.component';

const routes: Routes = [
  {
    path: '',
    component: MyImagesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyImagesRoutingModule { }
