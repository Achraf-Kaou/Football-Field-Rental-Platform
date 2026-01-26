import { Component, inject, signal } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LanguageService, Language } from '../../../services/language.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-navbar-main',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './navbar-main.html',
  styleUrl: './navbar-main.css',
})
export class NavbarMain {
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private languageService = inject(LanguageService);
  private toastService = inject(ToastService);

  // State signals
  isDarkMode = this.themeService.darkMode;
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  currentLanguage = this.languageService.currentLanguage;
  
  // UI state
  showLanguageMenu = signal(false);
  showUserMenu = signal(false);

  // Available languages
  languages = this.languageService.languages;

  // Navigation links for authenticated users
  userRoutes = [
    { path: '/user', label: 'navbar.home', icon: 'home' },
    { path: '/user/fields', label: 'navbar.fields', icon: 'sports_soccer' },
    { path: '/user/user-bookings', label: 'navbar.bookings', icon: 'event' },
    { path: '/user/chat', label: 'navbar.chat', icon: 'chat' }
  ];

  toggleTheme() {
    this.themeService.toggleDarkMode();
  }

  changeLanguage(lang: Language) {
    this.languageService.changeLanguage(lang);
    this.showLanguageMenu.set(false);
  }

  toggleLanguageMenu() {
    this.showLanguageMenu.update(val => !val);
    this.showUserMenu.set(false);
  }

  toggleUserMenu() {
    this.showUserMenu.update(val => !val);
    this.showLanguageMenu.set(false);
  }

  closeMenus() {
    this.showLanguageMenu.set(false);
    this.showUserMenu.set(false);
  }

  navigateToLogin() {
    this.router.navigate(['/login'], { queryParams: { mode: 'login' } });
  }

  navigateToRegister() {
    this.router.navigate(['/login'], { queryParams: { mode: 'signup' } });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.closeMenus();
        this.toastService.success('Successfully logged out.', 3000);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.toastService.error('Error during logout. Please try again.',5000);
        this.router.navigate(['/login']);
      }
    });
  }

  getCurrentLanguageOption() {
    return this.languageService.getCurrentLanguageOption();
  }

  isUserRole(): boolean {
    return this.currentUser()?.role === 'USER';
  }

  navigateToHome(){
    this.router.navigate([this.isAuthenticated() && this.isUserRole() ? '/user' : '/'])
  }
}