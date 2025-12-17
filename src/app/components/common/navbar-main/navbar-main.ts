import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../services/theme';

@Component({
  selector: 'app-navbar-main',
  imports: [],
  templateUrl: './navbar-main.html',
  styleUrl: './navbar-main.css',
})
export class NavbarMain {
  themeService = inject(ThemeService);
  isDarkMode = this.themeService.darkMode;

  toggleTheme() {
    this.themeService.toggleDarkMode();
  }
}
