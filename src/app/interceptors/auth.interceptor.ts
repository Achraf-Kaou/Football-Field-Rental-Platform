import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
  HttpEvent,
  HttpClient,
  HttpContextToken,
  HttpEventType,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of, timer } from 'rxjs';
import {
  catchError,
  switchMap,
  filter,
  take,
  tap,
  retry,
  finalize,
} from 'rxjs/operators';
import { TokenStorageService } from '../services/token-storage.service';
import { LoadingService } from '../services/loading.service';
import { HttpCacheService } from '../services/http-cache.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

// Context tokens
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);
export const SKIP_CACHE = new HttpContextToken<boolean>(() => false);
export const MAX_RETRIES = new HttpContextToken<number>(() => 3);
export const RETRY_DELAY = new HttpContextToken<number>(() => 1000);

/**
 * MAIN AUTH INTERCEPTOR
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);
  const http = inject(HttpClient);

  // Skip auth header for public endpoints
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  const token = tokenStorage.getAccessToken();
  const authReq = token ? addAuthHeader(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(authReq, next, tokenStorage, router, http);
      }
      return throwError(() => error);
    }),
  );
};

/**
 * LOGGING INTERCEPTOR
 */
export const loggingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const startTime = Date.now();

  console.log(`[HTTP] ${req.method} ${req.url}`);

  return next(req).pipe(
    tap((event) => {
      if (event.type === HttpEventType.Response) {
        const elapsed = Date.now() - startTime;
        console.log(
          `[HTTP] ${req.method} ${req.url} - ${event.status} (${elapsed}ms)`,
        );
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const elapsed = Date.now() - startTime;
      console.error(
        `[HTTP ERROR] ${req.method} ${req.url} - ${error.status} (${elapsed}ms)`,
        error.message,
      );
      return throwError(() => error);
    }),
  );
};

/**
 * ERROR INTERCEPTOR
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Bad request';
            break;
          case 401:
            errorMessage = 'Unauthorized - please login';
            break;
          case 403:
            errorMessage = 'Access forbidden';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 409:
            errorMessage = error.error?.message || 'Conflict';
            break;
          case 500:
            errorMessage = 'Internal server error';
            break;
          case 503:
            errorMessage = 'Service unavailable';
            break;
          default:
            errorMessage = error.error?.message || errorMessage;
        }
      }

      console.error('HTTP Error:', errorMessage);
      return throwError(() => new Error(errorMessage));
    }),
  );
};

/**
 * LOADING INTERCEPTOR
 */
export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const loadingService = inject(LoadingService);

  if (req.context.get(SKIP_LOADING)) {
    return next(req);
  }

  loadingService.show();

  return next(req).pipe(finalize(() => loadingService.hide()));
};

/**
 * CACHING INTERCEPTOR
 */
export const cachingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const cacheService = inject(HttpCacheService);

  if (req.method !== 'GET' || req.context.get(SKIP_CACHE)) {
    return next(req);
  }

  const cachedResponse = cacheService.get(req.url);
  if (cachedResponse) {
    return of(cachedResponse);
  }

  return next(req).pipe(
    tap((event) => {
      if (event.type === HttpEventType.Response) {
        cacheService.set(req.url, event);
      }
    }),
  );
};

/**
 * RETRY INTERCEPTOR
 */
export const retryInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const maxRetries = req.context.get(MAX_RETRIES) ?? 3;
  const retryDelay = req.context.get(RETRY_DELAY) ?? 1000;

  if (maxRetries === 0 || req.method !== 'GET') {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: maxRetries,
      delay: (error, retryCount) => {
        if (error.status >= 500 || error.status === 0) {
          const delayMs = retryDelay * Math.pow(2, retryCount - 1);
          console.log(
            `Retrying request (${retryCount}/${maxRetries}) in ${delayMs}ms`,
          );
          return timer(delayMs);
        }
        throw error;
      },
    }),
  );
};

/* ------------ Helper functions ------------- */

function addAuthHeader(
  req: HttpRequest<unknown>,
  token: string,
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function isPublicEndpoint(url: string): boolean {
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
  return publicEndpoints.some((endpoint) => url.includes(endpoint));
}

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStorage: TokenStorageService,
  router: Router,
  http: HttpClient,
): Observable<HttpEvent<unknown>> {
  const currentRefreshToken = tokenStorage.getRefreshToken();

  // If no refresh token, logout and redirect
  if (!currentRefreshToken) {
    tokenStorage.clear();
    router.navigate(['/login']);
    return throwError(() => new Error('No refresh token'));
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return http
      .post<{ accessToken: string; refreshToken?: string }>(
        'http://localhost:3000/auth/refresh',
        { refreshToken: currentRefreshToken },
      )
      .pipe(
        switchMap((response) => {
          isRefreshing = false;
          tokenStorage.setAccessToken(response.accessToken);
          if (response.refreshToken) {
            tokenStorage.setRefreshToken(response.refreshToken);
          }
          refreshTokenSubject.next(response.accessToken);
          return next(addAuthHeader(req, response.accessToken));
        }),
        catchError((error) => {
          isRefreshing = false;
          tokenStorage.clear();
          router.navigate(['/login']);
          return throwError(() => error);
        }),
      );
  } else {
    // Wait for refresh to complete
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next(addAuthHeader(req, token!))),
    );
  }
}
