import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateLoader, TranslateFakeLoader } from '@ngx-translate/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader
          }
        })
      ]
    });
  });

  it('initializes language from storage', () => {
    localStorage.setItem('selected_language', 'ar');
    const service = TestBed.inject(LanguageService);

    expect(service.currentLanguage()).toBe('ar');
    expect(localStorage.getItem('selected_language')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });
});
