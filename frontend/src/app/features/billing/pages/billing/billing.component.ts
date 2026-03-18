import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingApiService, BillingOverview, BillingPlan } from '../../billing-api.service';
import { AuthStateService } from '@services/auth-state.service';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  plans: BillingPlan[] = [];
  overview: BillingOverview | null = null;
  loading = true;
  checkoutLoadingCode = '';
  message = '';
  error = '';

  constructor(
    private readonly billingApi: BillingApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    public readonly authState: AuthStateService
  ) {}

  ngOnInit(): void {
    this.loadData();

    const sessionId = this.route.snapshot.queryParamMap.get('checkout_session_id');
    if (sessionId) {
      console.log('[BILLING] verify checkout', { sessionId });
      this.billingApi.verifyCheckout(sessionId).subscribe({
        next: overview => {
          this.overview = overview;
          this.authState.setUser({ plan: overview.currentPlan });
          this.message = 'Payment completed successfully.';
          this.router.navigate([], { queryParams: {}, replaceUrl: true });
        },
        error: error => {
          console.error('[BILLING] verify checkout failed', error);
          this.error = error?.error?.message || 'Unable to verify payment.';
        }
      });
    }
  }

  private loadData(): void {
    this.loading = true;

    this.billingApi.getPlans().subscribe({
      next: res => {
        this.plans = res?.plans ?? [];
        console.log('[BILLING] plans loaded', this.plans);
      },
      error: error => {
        console.error('[BILLING] load plans failed', error);
        this.error = 'Unable to load billing plans.';
      }
    });

    this.billingApi.getOverview().subscribe({
      next: overview => {
        this.overview = overview;
        this.authState.setUser({ plan: overview.currentPlan });
        this.loading = false;
        console.log('[BILLING] overview loaded', overview);
      },
      error: error => {
        console.error('[BILLING] load overview failed', error);
        this.error = 'Unable to load billing overview.';
        this.loading = false;
      }
    });
  }

  selectPlan(plan: BillingPlan): void {
    this.checkoutLoadingCode = plan.code;
    this.error = '';
    this.message = '';
    const returnUrl = `${window.location.origin}/app/billing`;

    console.log('[BILLING] checkout create', { plan: plan.code });
    this.billingApi.createCheckout(plan.code, returnUrl).subscribe({
      next: res => {
        if (res?.checkoutUrl) {
          window.location.href = res.checkoutUrl;
          return;
        }

        this.checkoutLoadingCode = '';
        this.error = 'Could not start the payment flow.';
      },
      error: error => {
        console.error('[BILLING] checkout create failed', error);
        this.checkoutLoadingCode = '';
        this.error = error?.error?.message || 'Could not start the payment flow.';
      }
    });
  }
}
