import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let req = request;
    const token = localStorage.getItem('painting_ai_token');

    if (req.url.startsWith('/api')) {
      req = req.clone({ url: `${environment.apiBaseUrl}${req.url}` });
    }

    if (token && !req.url.includes('/api/auth/login') && !req.url.includes('/api/auth/register')) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next.handle(req);
  }
}
