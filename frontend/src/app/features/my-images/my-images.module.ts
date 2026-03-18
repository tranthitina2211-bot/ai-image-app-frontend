import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyImagesRoutingModule } from './my-images-routing.module';
import { MyImagesComponent } from './pages/my-images/my-images.component';


import { SharedModule } from '@shared/shared.module';


@NgModule({
  declarations: [
    MyImagesComponent
  ],
  imports: [
    CommonModule,
    MyImagesRoutingModule,
    SharedModule
  ]
})
export class MyImagesModule { }
