import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HttpCacheService {
  private cache = new Map<string, { response: HttpResponse<any>, timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  get(url: string): HttpResponse<any> | null {
    const cached = this.cache.get(url);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(url);
      return null;
    }

    return cached.response;
  }

  set(url: string, response: HttpResponse<any>): void {
    this.cache.set(url, {
      response,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(url: string): void {
    this.cache.delete(url);
  }
}
