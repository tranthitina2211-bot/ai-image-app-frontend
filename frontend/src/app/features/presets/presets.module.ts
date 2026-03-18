import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SharedModule } from 'src/app/shared/shared.module';

import { PresetsRoutingModule } from './presets-routing.module';
import { PresetsComponent } from './pages/presets/presets.component';

@NgModule({
  declarations: [
    PresetsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    PresetsRoutingModule
  ]
})
export class PresetsModule {}
