import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../services/theme';

@Component({
  selector: 'app-theme-switch',
  imports: [MatIconModule],
  templateUrl: './theme-switch.html',
  styleUrl: './theme-switch.css',
})
export class ThemeSwitch {
  themeService = inject(ThemeService);
  isDarkMode = this.themeService.darkMode;

  toggleTheme() {
    this.themeService.toggleDarkMode();
  }
}
