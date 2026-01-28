import { AfterViewInit, Component, effect, ElementRef, HostListener, inject, OnInit, output, QueryList, signal, viewChild, ViewChildren, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService, Language } from '../../../services/language.service';
import { ComplexService } from '../../../services/complex.service';
import { Complex } from '../../../models/complex.model';

@Component({
  selector: 'app-manager-sidebar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './manager-sidebar.html',
  styleUrl: './manager-sidebar.css',
})
export class ManagerSidebar implements AfterViewInit, OnInit {
  @ViewChildren('navButton') navButtons!: QueryList<ElementRef<HTMLButtonElement>>;
  private isMobileView = signal(false);
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private complexService = inject(ComplexService);

  isDarkMode = this.themeService.darkMode;
  user = this.authService.currentUser;
  currentLanguage = this.languageService.currentLanguage;
  languages = this.languageService.languages;
  showUserMenu = signal(false);
  showLanguageMenu = signal(false);
  showBookingsDropdown = signal(false);
  showAvailabilityDropdown = signal(false);
  
  // Complexes for the current user
  userComplexes = signal<Complex[]>([]);
  loadingComplexes = signal(false);

  // Query signals for DOM elements
  sidebar = viewChild.required<ElementRef>('sidebar');
  nav = viewChild.required<ElementRef>('nav');
  buttons = viewChildren<ElementRef>('navButton');

  menu = signal([
    { id: 0, name: 'sidebar.dashboard', icon: 'dashboard', path: '/manager', active: true, hasDropdown: false },
    { id: 1, name: 'sidebar.complexes', icon: 'stadium', path: '/manager/complex-list', active: false, hasDropdown: false },
    { id: 2, name: 'sidebar.bookings', icon: 'shopping_cart', path: null, active: false, hasDropdown: true },
    { id: 3, name: 'sidebar.availability', icon: 'event_available', path: null, active: false, hasDropdown: true },
    { id: 4, name: 'sidebar.chat', icon: 'chat', path: 'chat', active: false, hasDropdown: false },

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

    // Effect to handle language changes and update text direction
    effect(() => {
      const lang = this.currentLanguage();
      if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', lang);
      }
    });
  }

  ngOnInit(): void {
    this.loadUserComplexes();
  }

  ngAfterViewInit() {
    this.checkMobileView();
    this.updateActiveButton();
  }

  // Load user's complexes
  loadUserComplexes() {
    const userId = this.user()?.id;
    if (!userId) return;

    this.loadingComplexes.set(true);
    this.complexService.getAllComplexes(1, 100, '', 'all', userId).subscribe({
      next: (complexes) => {
        this.userComplexes.set(complexes);
        this.loadingComplexes.set(false);
      },
      error: (error) => {
        console.error('Error loading complexes:', error);
        this.loadingComplexes.set(false);
        this.toastService.error(this.translate.instant('errors.loadComplexes'), 3000);
      }
    });
  }

  // Toggle sidebar collapsed/expanded
  toggleCollapse() {
    this.isCollapsed.update(value => {
      const newState = !value;
      this.collapsedOutput.emit(newState);
      this.announceToScreenReader(
        newState 
          ? this.translate.instant('sidebar.collapseSidebar')
          : this.translate.instant('sidebar.expandSidebar')
      );
      return newState;
    });
  }

  // Handle button click
  onButtonClick(index: number, path: string | null, hasDropdown: boolean = false) {
    if (hasDropdown) {
      // Toggle the appropriate dropdown
      if (index === 2) { // Bookings
        this.showBookingsDropdown.update(val => !val);
        this.showAvailabilityDropdown.set(false);
      } else if (index === 3) { // Availability
        this.showAvailabilityDropdown.update(val => !val);
        this.showBookingsDropdown.set(false);
      }
      return;
    }

    if (!path) return;

    this.activeIndex.set(index);
    this.updateActiveButton();

    // Close dropdowns
    this.closeDropdowns();

    // Close sidebar on mobile after selection
    if (this.isMobileView()) {
      this.isCollapsed.set(true);
      this.collapsedOutput.emit(true);
    }

    // Navigate to path
    this.router.navigate([path]);
  }

  // Navigate to complex booking
  navigateToBooking(complexId: number) {
    console.log('Navigating to bookings for complex', complexId);
    this.router.navigate(['/manager/manager-booking', complexId]);
    this.closeDropdowns();
    
    if (this.isMobileView()) {
      this.isCollapsed.set(true);
      this.collapsedOutput.emit(true);
    }
  }

  // Navigate to complex availability
  navigateToAvailability(complexId: number) {
    this.router.navigate(['/manager/field-availability', complexId]);
    this.closeDropdowns();
    
    if (this.isMobileView()) {
      this.isCollapsed.set(true);
      this.collapsedOutput.emit(true);
    }
  }

  // Close all dropdowns
  closeDropdowns() {
    this.showBookingsDropdown.set(false);
    this.showAvailabilityDropdown.set(false);
  }

  // Update active button styling
  private updateActiveButton() {
    const buttonElements = this.buttons();
    const activeIdx = this.activeIndex();
    
    buttonElements.forEach((button, i) => {
      if (i === activeIdx) {
        button.nativeElement.classList.add('active');
      } else {
        button.nativeElement.classList.remove('active');
      }
    });
  }

  toggleTheme() {
    this.themeService.toggleDarkMode();
    const message = this.isDarkMode()
      ? this.translate.instant('sidebar.switchToDarkMode')
      : this.translate.instant('sidebar.switchToLightMode');
    this.announceToScreenReader(message);
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobileView();
  }

  private checkMobileView() {
    const isMobile = window.innerWidth <= 768;
    this.isMobileView.set(isMobile);
    
    // Auto-collapse on mobile
    if (isMobile && !this.isCollapsed()) {
      this.isCollapsed.set(true);
      this.collapsedOutput.emit(true);
    }
  }

  isMobile(): boolean {
    return this.isMobileView();
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const buttons = this.navButtons.toArray();
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (index + 1) % buttons.length;
        buttons[nextIndex].nativeElement.focus();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = (index - 1 + buttons.length) % buttons.length;
        buttons[prevIndex].nativeElement.focus();
        break;
        
      case 'Home':
        event.preventDefault();
        buttons[0].nativeElement.focus();
        break;
        
      case 'End':
        event.preventDefault();
        buttons[buttons.length - 1].nativeElement.focus();
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        buttons[index].nativeElement.click();
        break;
        
      case 'Escape':
        if (this.isMobileView() && !this.isCollapsed()) {
          event.preventDefault();
          this.toggleCollapse();
        }
        break;
    }
  }

  private announceToScreenReader(message: string) {
    const liveRegion = document.getElementById('sr-live-region') || this.createLiveRegion();
    liveRegion.textContent = message;
    
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }

  private createLiveRegion(): HTMLElement {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(liveRegion);
    
    return liveRegion;
  }

  toggleUserMenu() {
    this.showUserMenu.update(val => !val);
    this.showLanguageMenu.set(false);
    this.closeDropdowns();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('auth.logoutSuccess'), 3000);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.toastService.error(this.translate.instant('auth.logoutError'), 5000);
        this.router.navigate(['/login']);
      }
    });
  }

  getCurrentLanguageOption() {
    return this.languageService.getCurrentLanguageOption();
  }

  toggleLanguageMenu() {
    this.showLanguageMenu.update(val => !val);
    this.showUserMenu.set(false);
    this.closeDropdowns();
  }

  changeLanguage(langCode: string) {
    console.log('changeLanguage called, code=', langCode);

    const langs = typeof this.languages === 'function' ? (this.languages as () => Language[])() : this.languages;

    if (!Array.isArray(langs)) {
      console.error('languages is not an array', langs);
      return;
    }

    const language = langs.find(l => (l as any).code === langCode || (l as any) === langCode);
    if (!language) {
      console.warn('language not found for code', langCode);
      return;
    }

    this.languageService.changeLanguage(langCode as Language);
    this.showLanguageMenu.set(false);
    this.announceToScreenReader(`${this.translate.instant('sidebar.changeLanguage')}: ${(language as any).name || language}`);
  }

  closeMenus() {
    this.showLanguageMenu.set(false);
    this.showUserMenu.set(false);
    this.closeDropdowns();
  }
}