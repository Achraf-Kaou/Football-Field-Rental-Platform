import { Component, input, output, computed, EventEmitter, Signal } from '@angular/core';

export interface CurrentUser {
  name: string;
  role: 'user' | 'manager';
}

// Dummy icons; adaptez avec vos icônes personnalisées ou lib Angular/Lucide (svg dans le template)
const ICONS = {
  chat: '<svg><!-- ...icon... --></svg>',
  calendar: '<svg><!-- ...icon... --></svg>',
  dashboard: '<svg><!-- ...icon... --></svg>',
  user: '<svg><!-- ...icon... --></svg>',
  globe: '<svg><!-- ...icon... --></svg>',
  logOut: '<svg><!-- ...icon... --></svg>',
  menu:  '<svg><!-- ...icon... --></svg>',
};

@Component({
  selector: 'app-header',
  templateUrl: './navbar.component.html'
})
export class NavBarComponent {
  currentPage = input<string>('');
  language = input<string>('fr');
  currentUser = input<CurrentUser | null>(null);

  onNavigate = output<string>();
  onLanguageChange = output<string>();
  onLogin = output<void>();
  onLogout = output<void>();


  navItems = computed(() => {
    const items = [
      { id: 'home', label: 'home', icon: null },
      { id: 'fields', label: 'fields', icon: null },
      { id: 'chat', label: 'chat', icon: 'chat' },
    ];
    if (this.currentUser()) {
      items.push({ id: 'bookings', label: 'myBookings', icon: 'calendar' });
      if (this.currentUser()!.role === 'manager') {
        items.push({ id: 'dashboard', label: 'dashboard', icon: 'dashboard' });
      }
    }
    return items;
  });
}
