import { AfterViewInit, Component, effect, ElementRef, inject, output, signal, viewChild, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manager-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-sidebar.html',
  styleUrl: './manager-sidebar.css',
})
export class ManagerSidebar implements AfterViewInit {
  private themeService = inject(ThemeService);
  private router = inject(Router);
  isDarkMode = this.themeService.darkMode;

  // Query signals for DOM elements
  sidebar = viewChild.required<ElementRef>('sidebar');
  nav = viewChild.required<ElementRef>('nav');
  buttons = viewChildren<ElementRef>('navButton');

  menu = signal([
    { id: 0, name: 'Dashboard', icon: 'dashboard', path: '/manager' },
    { id: 1, name: 'Complexes', icon: 'stadium', path: '/manager/complex-list' },
    { id: 2, name: 'Availability', icon: 'event_available', path: '/manager/field-availability' },
    { id: 3, name: 'Bookings', icon: 'shopping_cart', path: '/manager/manager-booking' },
    { id: 4, name: 'Settings', icon: 'settings', path: '/manager/settings' },
  ]);

  // State signals
  isCollapsed = signal(false);
  collapsedOutput = output<boolean>();
  activeIndex = signal(0);

  constructor() {
    // Effect to update CSS variable when active index changes
    effect(() => {
      const index = this.activeIndex();
      const navElement = this.nav().nativeElement;

      if (navElement) {
        const topPosition = index * 56;
        navElement.style.setProperty('--top', `${topPosition}px`);
      }
    });
  }

  ngAfterViewInit() {
    // Set initial active button
    const buttonElements = this.buttons();
    if (buttonElements.length > 0) {
      buttonElements[0].nativeElement.classList.add('active');
    }

    // Initialize CSS variable
    const navElement = this.nav().nativeElement;
    navElement.style.setProperty('--top', '0px');
  }

  // Toggle sidebar collapsed/expanded
  toggleCollapse() {
    this.isCollapsed.update(value => !value);
    this.collapsedOutput.emit(this.isCollapsed());
  }

  // Handle button click
  onButtonClick(index: number, path: string) {
    this.activeIndex.set(index);

    // Update active class on buttons
    const buttonElements = this.buttons();
    buttonElements.forEach((button, i) => {
      if (i === index) {
        button.nativeElement.classList.add('active');
      } else {
        button.nativeElement.classList.remove('active');
      }
    });

    // Navigate to path (implement your routing logic here)
    this.router.navigate([path]);
  }

  toggleTheme() {
    this.themeService.toggleDarkMode();
  }
}