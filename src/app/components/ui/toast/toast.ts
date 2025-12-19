import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ToastService, Toast } from '../../../services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class ToastComponent implements OnInit {
  private toastService = inject(ToastService);
  private timeouts = new Map<string, number>();

  // ✅ Get toasts from service signal
  toasts = this.toastService.toasts;

  readonly toastConfig = {
    success: {
      icon: 'M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z',
      iconClass: 'text-green-500 bg-green-100'
    },
    error: {
      icon: 'M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z',
      iconClass: 'text-red-500 bg-red-100'
    },
    warning: {
      icon: 'M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 1 1-2 0V6a1 1 0 0 1 2 0v5Z',
      iconClass: 'text-yellow-500 bg-yellow-100'
    },
    info: {
      icon: 'M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z',
      iconClass: 'text-blue-500 bg-blue-100'
    }
  } as const;

  constructor() {
    // ✅ Use effect to handle auto-removal of toasts
    effect(() => {
      const currentToasts = this.toasts();

      // Set up timeouts for new toasts
      currentToasts.forEach(toast => {
        if (toast.duration && toast.duration > 0 && !this.timeouts.has(toast.id)) {
          const timeout = window.setTimeout(() => {
            this.removeToast(toast.id);
          }, toast.duration);

          this.timeouts.set(toast.id, timeout);
        }
      });

      // Clean up timeouts for removed toasts
      const currentIds = new Set(currentToasts.map(t => t.id));
      this.timeouts.forEach((timeout, id) => {
        if (!currentIds.has(id)) {
          clearTimeout(timeout);
          this.timeouts.delete(id);
        }
      });
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Check for stored toast on init
    this.toastService.checkStoredToast();
  }

  removeToast(id: string): void {
    // ✅ Clear timeout
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }

    // ✅ Remove toast via service
    this.toastService.removeToast(id);
  }

  getConfig(type: Toast['type']) {
    return this.toastConfig[type] || this.toastConfig.info;
  }
}
