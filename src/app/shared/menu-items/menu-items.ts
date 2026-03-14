import { Injectable } from '@angular/core';

export interface MenuItem {
  state: string;
  name: string;
  type: 'link';
  icon: string;
  route: string;
}

const MENUITEMS: MenuItem[] = [
  {
    state: 'app/create',
    name: 'Create',
    type: 'link',
    icon: 'auto_awesome',
    route: '/app/create'
  },
  {
    state: 'app/my-images',
    name: 'My Images',
    type: 'link',
    icon: 'image',
    route: '/app/my-images'
  },
  {
    state: 'app/favorites',
    name: 'Favorites',
    type: 'link',
    icon: 'star',
    route: '/app/favorites'
  },
  {
    state: 'app/presets',
    name: 'Presets',
    type: 'link',
    icon: 'collections',
    route: '/app/presets'
  },
  {
    state: 'app/notifications',
    name: 'Notifications',
    type: 'link',
    icon: 'notifications',
    route: '/app/notifications'
  },
  {
    state: 'app/billing',
    name: 'Billing',
    type: 'link',
    icon: 'credit_card',
    route: '/app/billing'
  },
  {
    state: 'app/account',
    name: 'Account',
    type: 'link',
    icon: 'person',
    route: '/app/account'
  },
  {
    state: 'app/settings',
    name: 'Settings',
    type: 'link',
    icon: 'settings',
    route: '/app/settings'
  }
];

@Injectable({
  providedIn: 'root'
})
export class MenuItems {
  getMenuitem(): MenuItem[] {
    return MENUITEMS;
  }
}
