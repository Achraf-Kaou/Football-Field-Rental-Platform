import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor, cachingInterceptor, errorInterceptor, loadingInterceptor, loggingInterceptor, retryInterceptor } from './interceptors/auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideTranslateHttpLoader, TranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideTranslateService, TranslateLoader, TranslateModule } from '@ngx-translate/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withFetch(), // Use modern Fetch API
      withInterceptors([
        loggingInterceptor,      // Log all requests
        loadingInterceptor,      // Show loading indicator
        cachingInterceptor,      // Cache GET requests
        authInterceptor,         // Add auth token
        retryInterceptor,        // Retry failed requests
        errorInterceptor,        // Handle errors
      ])
    ),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'en',
      lang: 'en'
    }),
  ]
};
