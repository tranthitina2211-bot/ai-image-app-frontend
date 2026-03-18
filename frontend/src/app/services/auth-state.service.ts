import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AuthUser {
  id?: number;
  name: string;
  email: string;
  avatar: string;
  plan: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly storageKey = 'painting_ai_auth_state';
  private readonly userKey = 'painting_ai_auth_user';
  private readonly tokenKey = 'painting_ai_token';

  private readonly defaultUser: AuthUser = {
    name: 'Guest User',
    email: 'guest@example.com',
    avatar: 'assets/images/users/1.jpg',
    plan: 'Free'
  };

  private readonly loggedInSubject = new BehaviorSubject<boolean>(this.readLoggedIn());
  readonly loggedIn$ = this.loggedInSubject.asObservable();

  private readonly userSubject = new BehaviorSubject<AuthUser>(this.readUser());
  readonly user$ = this.userSubject.asObservable();

  get isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }

  get currentUser(): AuthUser {
    return this.userSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(payload: { token: string; user: Partial<AuthUser> }): void {
    const user = { ...this.defaultUser, ...(payload.user ?? {}) };

    localStorage.setItem(this.storageKey, '1');
    localStorage.setItem(this.userKey, JSON.stringify(user));
    localStorage.setItem(this.tokenKey, payload.token);

    this.userSubject.next(user);
    this.loggedInSubject.next(true);
  }

  setUser(user: Partial<AuthUser>): void {
    const next = { ...this.userSubject.value, ...user };
    localStorage.setItem(this.userKey, JSON.stringify(next));
    this.userSubject.next(next);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.storageKey, '1');
    this.loggedInSubject.next(true);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next(this.defaultUser);
    this.loggedInSubject.next(false);
  }

  private readLoggedIn(): boolean {
    return localStorage.getItem(this.storageKey) === '1' && !!localStorage.getItem(this.tokenKey);
  }

  private readUser(): AuthUser {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return this.defaultUser;
    }

    try {
      return { ...this.defaultUser, ...(JSON.parse(raw) as Partial<AuthUser>) };
    } catch {
      return this.defaultUser;
    }
  }
}
