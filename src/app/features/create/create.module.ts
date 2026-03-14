import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';

import { CreateRoutingModule } from './create-routing.module';
import { CreateComponent } from './pages/create/create.component';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';



@NgModule({
  declarations: [
    CreateComponent
  ],
  imports: [
    CommonModule,
    CreateRoutingModule,
    MatIconModule,
    MatProgressBarModule,
    SharedModule

  ]
})
export class CreateModule { }
