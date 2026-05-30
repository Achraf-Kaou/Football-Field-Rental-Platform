import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'en' | 'fr' | 'ar';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANGUAGE_KEY = 'selected_language';
  
  // Available languages
  public readonly languages: LanguageOption[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇹🇳' }
  ];

  // Current language signal
  private currentLanguageSignal = signal<Language>('en');
  public currentLanguage = this.currentLanguageSignal.asReadonly();

  constructor(private translate: TranslateService) {
    this.initializeLanguage();
  }

  /**
   * Initialize language service
   */
  private initializeLanguage(): void {
    const savedLang = this.loadLanguageFromStorage();
    
    // Set available languages
    this.translate.addLangs(this.languages.map(l => l.code));
    
    // Set default language
    this.translate.setDefaultLang('en');
    
    // Use saved or browser language
    this.translate.use(savedLang);
    this.currentLanguageSignal.set(savedLang);
    localStorage.setItem(this.LANGUAGE_KEY, savedLang);
    
    // Set HTML dir attribute for RTL support
    this.updateDirection(savedLang);
  }

  /**
   * Load language from localStorage
   */
  private loadLanguageFromStorage(): Language {
    const saved = localStorage.getItem(this.LANGUAGE_KEY) as Language;
    if (saved && this.languages.some(l => l.code === saved)) {
      return saved;
    }
    
    // Detect browser language
    const browserLang = this.translate.getBrowserLang();
    return (browserLang === 'fr' || browserLang === 'ar') ? browserLang as Language : 'en';
  }

  /**
   * Change language
   */
  changeLanguage(lang: Language): void {
    this.translate.use(lang);
    this.currentLanguageSignal.set(lang);
    localStorage.setItem(this.LANGUAGE_KEY, lang);
    this.updateDirection(lang);
  }

  /**
   * Update text direction for RTL support
   */
  private updateDirection(lang: Language): void {
    const htmlElement = document.documentElement;
    if (lang === 'ar') {
      htmlElement.setAttribute('dir', 'rtl');
      htmlElement.setAttribute('lang', 'ar');
    } else {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.setAttribute('lang', lang);
    }
  }

  /**
   * Get current language option
   */
  getCurrentLanguageOption(): LanguageOption {
    return this.languages.find(l => l.code === this.currentLanguage()) || this.languages[0];
  }
}
