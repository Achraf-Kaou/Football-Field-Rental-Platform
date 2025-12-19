import { HttpInterceptorFn, HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Authentication interceptor - adds Bearer token to requests and handles 401 errors
 */
export const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Skip auth header for public endpoints
    if (isPublicEndpoint(req.url)) {
        return next(req);
    }

    // Add authentication token to request
    const token = authService.getToken();
    const authReq = token ? addAuthHeader(req, token) : req;

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                return handle401Error(authReq, next, authService, router);
            }
            return throwError(() => error);
        })
    );
};

/**
 * Logging interceptor - logs all HTTP requests and responses
 */
export const loggingInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const startTime = Date.now();

    console.log(`[HTTP] ${req.method} ${req.url}`);

    return next(req).pipe(
        tap((event) => {
            if (event.type === HttpEventType.Response) {
                const elapsed = Date.now() - startTime;
                console.log(
                    `[HTTP] ${req.method} ${req.url} - ${event.status} (${elapsed}ms)`
                );
            }
        }),
        catchError((error: HttpErrorResponse) => {
            const elapsed = Date.now() - startTime;
            console.error(
                `[HTTP ERROR] ${req.method} ${req.url} - ${error.status} (${elapsed}ms)`,
                error.message
            );
            return throwError(() => error);
        })
    );
};

/**
 * Error handling interceptor - provides user-friendly error messages
 */
export const errorInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unexpected error occurred';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Server-side error
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
        })
    );
};

/**
 * Loading indicator interceptor - tracks ongoing requests
 */
export const loadingInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const loadingService = inject(LoadingService);

    // Skip loading indicator for certain endpoints
    if (req.context.get(SKIP_LOADING)) {
        return next(req);
    }

    loadingService.show();

    return next(req).pipe(
        finalize(() => loadingService.hide())
    );
};

/**
 * Caching interceptor - caches GET requests
 */
export const cachingInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const cacheService = inject(HttpCacheService);

    // Only cache GET requests
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
        })
    );
};

/**
 * Retry interceptor - retries failed requests with exponential backoff
 */
export const retryInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
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
                // Only retry on 5xx errors or network errors
                if (error.status >= 500 || error.status === 0) {
                    const delay = retryDelay * Math.pow(2, retryCount - 1);
                    console.log(`Retrying request (${retryCount}/${maxRetries}) in ${delay}ms`);
                    return timer(delay);
                }
                throw error;
            }
        })
    );
};

// Helper functions

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });
}

function isPublicEndpoint(url: string): boolean {
    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    return publicEndpoints.some(endpoint => url.includes(endpoint));
}

function handle401Error(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
    authService: AuthService,
    router: Router
): Observable<HttpEvent<unknown>> {
    if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshToken().pipe(
            switchMap((response) => {
                isRefreshing = false;
                refreshTokenSubject.next(response.accessToken);
                return next(addAuthHeader(req, response.accessToken));
            }),
            catchError((error) => {
                isRefreshing = false;
                authService.logout();
                router.navigate(['/login']);
                return throwError(() => error);
            })
        );
    } else {
        return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => next(addAuthHeader(req, token!)))
        );
    }
}

// Context tokens for interceptor configuration

import { HttpContext, HttpContextToken, HttpEventType } from '@angular/common/http';
import { finalize, of, retry, tap, timer } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { HttpCacheService } from '../services/http-cache.service';

export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);
export const SKIP_CACHE = new HttpContextToken<boolean>(() => false);
export const MAX_RETRIES = new HttpContextToken<number>(() => 3);
export const RETRY_DELAY = new HttpContextToken<number>(() => 1000);
