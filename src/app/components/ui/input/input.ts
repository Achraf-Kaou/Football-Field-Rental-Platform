import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <input
      [type]="type()"
      [placeholder]="placeholder()"
      [(ngModel)]="value"
      [disabled]="disabled()"
      class="flex h-12 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-surface-card px-4 py-3 text-sm text-gray-900 dark:text-white ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all"
    />
  `
})
export class InputComponent {
  type = input('text');
  placeholder = input('');
  disabled = input(false);
  value = model('');
}
