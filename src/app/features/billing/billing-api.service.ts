import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BillingPlan {
  code: string;
  name: string;
  price: string;
  amount: number;
  currency: string;
  desc: string;
  features: string[];
  highlight?: boolean;
}

export interface BillingOverview {
  currentPlan: string;
  renewsOn: string | null;
  paymentProvider: string;
  paymentMethodLabel: string;
  invoices: Array<{ id: string; label: string; amount: string; status: string }>;
}

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  constructor(private readonly http: HttpClient) {}

  getPlans(): Observable<{ plans: BillingPlan[] }> {
    return this.http.get<{ plans: BillingPlan[] }>('/api/billing/plans');
  }

  getOverview(): Observable<BillingOverview> {
    return this.http.get<BillingOverview>('/api/billing/overview');
  }

  createCheckout(planCode: string, frontendReturnUrl: string): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>('/api/billing/checkout', {
      plan: planCode,
      frontend_return_url: frontendReturnUrl
    });
  }

  verifyCheckout(sessionId: string): Observable<BillingOverview> {
    return this.http.get<BillingOverview>(`/api/billing/verify?session_id=${encodeURIComponent(sessionId)}`);
  }
}
