import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // ✅ Use signal instead of ReplaySubject
  private toastsSignal = signal<Toast[]>([]);
  
  // ✅ Expose readonly signal
  public toasts = this.toastsSignal.asReadonly();

  show(type: Toast['type'], message: string, duration: number = 5000): void {
    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      duration
    };
    
    // Add new toast to the array
    this.toastsSignal.update(toasts => [...toasts, toast]);
  }

  success(message: string, duration?: number): void {
    this.show('success', message, duration);
  }

  error(message: string, duration?: number): void {
    this.show('error', message, duration);
  }

  warning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration?: number): void {
    this.show('info', message, duration);
  }

  // ✅ Remove a specific toast
  removeToast(id: string): void {
    this.toastsSignal.update(toasts => toasts.filter(toast => toast.id !== id));
  }

  // For redirects - store in sessionStorage
  storeForRedirect(type: Toast['type'], message: string): void {
    sessionStorage.setItem('pendingToast', JSON.stringify({ type, message }));
  }

  // Check and show stored toast
  checkStoredToast(): void {
    const stored = sessionStorage.getItem('pendingToast');
    if (stored) {
      try {
        const { type, message } = JSON.parse(stored);
        this.show(type, message, 3000);
        sessionStorage.removeItem('pendingToast');
      } catch (error) {
        console.error('Failed to parse stored toast:', error);
        sessionStorage.removeItem('pendingToast');
      }
    }
  }
}
