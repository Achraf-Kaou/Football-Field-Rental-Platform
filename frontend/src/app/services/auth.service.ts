import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, throwError } from 'rxjs';
import { tap, catchError, take, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import { BroadcastService } from './broadcast-message.service';
import { UserRole } from '../guards/role.guard';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  googleId?: string;
  facebookId?: string;
  provider?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000';
  private readonly TOKEN_KEY = environment.tokenKey || 'access_token';
  private readonly REFRESH_TOKEN_KEY = environment.refreshTokenKey || 'refresh_token';
  private readonly USER_KEY = 'current_user';
  private readonly OAUTH_CHANNEL = 'google-oauth-channel';

  // ✅ Signals for reactive state
  private currentUserSignal = signal<User | null>(this.loadUserFromStorage());
  private isAuthenticatedSignal = computed(() => !!this.currentUserSignal());

  // ✅ Public readonly signals
  public currentUser = this.currentUserSignal.asReadonly();
  public isAuthenticated = this.isAuthenticatedSignal;

  constructor(
    private http: HttpClient,
    private router: Router,
    private broadcastService: BroadcastService
  ) {
    
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Verify token validity
   */
  private verifyToken(): void {
    this.getProfile().subscribe({
      error: () => this.clearAuthData()
    });
  }

  /**
   * Register a new user
   */
  register(registerDto: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, registerDto)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Login user
   */
  login(loginDto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, loginDto)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
 * Google OAuth login using window.postMessage (more compatible)
 */
  async loginWithGoogle(): Promise<AuthResponse> {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `${this.API_URL}/auth/google`,
      'GoogleLogin',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    return new Promise((resolve, reject) => {
      let isResolved = false;

      // Listen for messages from popup
      const messageHandler = (event: MessageEvent) => {
        // Security check: verify origin
        if (event.origin !== window.location.origin) {
          console.warn('Ignored message from unknown origin:', event.origin);
          return;
        }

        if (isResolved) return;

        const data = event.data;

        if (data.type === 'oauth-success' && data.payload) {
          isResolved = true;
          console.log('✅ Received OAuth success');

          cleanup();
          this.handleAuthResponse(data.payload);
          resolve(data.payload);

        } else if (data.type === 'oauth-error') {
          isResolved = true;
          console.error('❌ Received OAuth error');

          cleanup();
          reject(new Error(data.payload?.message || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Monitor popup
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(new Error('Authentication cancelled - popup was closed'));
          }
        }
      }, 500);

      // Timeout
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          reject(new Error('Authentication timeout'));
        }
      }, 5 * 60 * 1000);

      function cleanup() {
        window.removeEventListener('message', messageHandler);
        clearInterval(popupCheckInterval);
        clearTimeout(timeout);
        if (popup && !popup.closed) {
          popup.close();
        }
      }
    });
  }

  /**
   * Facebook OAuth login - Opens popup window
   */
  loginWithFacebook(): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        `${this.API_URL}/auth/facebook`,
        'Facebook Login',
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data && event.data.accessToken) {
          try {
            this.handleAuthResponse(event.data);
            window.removeEventListener('message', messageHandler);
            popup.close();
            resolve(event.data);
          } catch (error) {
            window.removeEventListener('message', messageHandler);
            popup.close();
            reject(error);
          }
        }
      };

      window.addEventListener('message', messageHandler);

      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval);
          window.removeEventListener('message', messageHandler);

          if (!this.isAuthenticated()) {
            reject(new Error('Authentication cancelled'));
          }
        }
      }, 500);
    });
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${this.API_URL}/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        this.setToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
      }),
      catchError(error => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/logout`, {})
      .pipe(
        tap(() => this.clearAuthData()),
        catchError(error => {
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  /**
   * Get current user profile
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/profile`, {headers: {
      'Authorization': `Bearer ${this.getToken()}` 
    }})
      .pipe(
        tap(user => {
          this.currentUserSignal.set(user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Handle authentication response
   */
  private handleAuthResponse(response: AuthResponse): void {
    this.setToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);
    this.currentUserSignal.set(response.user);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set access token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Set refresh token
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getUserRole(): UserRole {
    // Get role from localStorage, JWT token, or your auth state
    const role = this.currentUserSignal()?.role as UserRole;
    return role as UserRole;
  }
  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.message || errorMessage;
    }

    console.error('Auth Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
