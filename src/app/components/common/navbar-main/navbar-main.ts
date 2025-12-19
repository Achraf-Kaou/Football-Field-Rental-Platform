import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-main',
  imports: [],
  templateUrl: './navbar-main.html',
  styleUrl: './navbar-main.css',
})
export class NavbarMain {
  private themeService = inject(ThemeService);
  private router = inject(Router);

  isDarkMode = this.themeService.darkMode;

  toggleTheme() {
    this.themeService.toggleDarkMode();
  }

  handleButtonClick() {
    this.router.navigate(['/login']);
  }
}
