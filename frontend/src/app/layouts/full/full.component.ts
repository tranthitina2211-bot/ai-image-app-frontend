import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { MenuItems } from '../../shared/menu-items/menu-items';
import { Router, NavigationEnd } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-full-layout',
  templateUrl: 'full.component.html',
  styleUrls: ['./full.component.scss']
})
export class FullComponent implements OnDestroy, AfterViewInit {
  mobileQuery: MediaQueryList;
  @ViewChild('snav') snav!: MatSidenav;
  isLanding = false;
  isAuthPage = false;

  private _mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    public menuItems: MenuItems,
    private readonly router: Router
  ) {
    this.mobileQuery = media.matchMedia('(min-width: 1024px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        this.isLanding = url === '/';
        this.isAuthPage = url.startsWith('/auth') || url === '/404';
      }
    });
  }

  toggleSidebar(): void {
    if (!this.isLanding && !this.isAuthPage && this.snav) {
      this.snav.toggle();
    }
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  ngAfterViewInit(): void {}
}
