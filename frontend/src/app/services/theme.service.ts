import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Initialize from localStorage or default to false (light mode)
  darkMode = signal<boolean>(
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('darkMode') ?? 'false')
      : false
  );

  constructor() {
    // Sync dark mode changes to localStorage and DOM
    effect(() => {
      const isDark = this.darkMode();
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', JSON.stringify(isDark));
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }

  toggleDarkMode() {
    this.darkMode.update(value => !value);
  }
}
