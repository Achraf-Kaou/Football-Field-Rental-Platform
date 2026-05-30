import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private accessToken = signal<string | null>(null);
  private refreshToken = signal<string | null>(null);

  constructor() {
    this.accessToken.set(localStorage.getItem('accessToken'));
    this.refreshToken.set(localStorage.getItem('refreshToken'));
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  setAccessToken(token: string | null): void {
    this.accessToken.set(token);
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getRefreshToken(): string | null {
    return this.refreshToken();
  }

  setRefreshToken(token: string | null): void {
    this.refreshToken.set(token);
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  clear(): void {
    this.setAccessToken(null);
    this.setRefreshToken(null);
  }
}
