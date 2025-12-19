import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 rounded-2xl border border-gray-200 dark:border-white/5 bg-surface-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent { }