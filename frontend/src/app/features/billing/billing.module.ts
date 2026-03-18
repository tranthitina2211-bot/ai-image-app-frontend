import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { BillingRoutingModule } from './billing-routing.module';
import { BillingComponent } from './pages/billing/billing.component';

@NgModule({
  declarations: [BillingComponent],
  imports: [CommonModule, SharedModule, BillingRoutingModule]
})
export class BillingModule {}
