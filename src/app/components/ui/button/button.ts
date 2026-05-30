import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [type]="type()"
      [class]="getButtonClasses()"
      [disabled]="disabled()">
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  variant = input<'default' | 'outline' | 'primary' | 'accent'>('default');
  size = input<'default' | 'lg'>('default');
  type = input<'button' | 'submit'>('button');
  disabled = input(false);

  getButtonClasses(): string {
    const base = 'inline-flex items-center justify-center rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      default: 'bg-gray-200 dark:bg-surface-card text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10',
      outline: 'border-2 border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-surface-dark text-gray-900 dark:text-white hover:scale-105',
      primary: 'bg-primary hover:bg-green-400 text-background-dark shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95',
      accent: 'bg-accent hover:bg-orange-400 text-white shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 hover:scale-105 active:scale-95'
    };

    const sizes = {
      default: 'h-10 py-2 px-4 text-sm',
      lg: 'h-12 px-8 text-base'
    };

    return `${base} ${variants[this.variant()]} ${sizes[this.size()]}`;
  }
}