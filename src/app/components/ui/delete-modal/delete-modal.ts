import { Component, input, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-delete-modal',
  imports: [],
  templateUrl: './delete-modal.html',
  styleUrl: './delete-modal.css',
})
export class DeleteModal implements OnInit {
  icon = input<string>("delete");
  title = input<string>();
  message = input<string>();
  cancelText = input<string>('Cancel');
  confirmText = input<string>('Confirm');
  cancelAction = input<() => void>();
  confirmAction = input<() => void>();
  severity = input<'success' | 'error' | 'warning' | 'info'>('error');

  color = signal('red');

  ngOnInit(): void {
    this.color.set(this.severity() === 'error' ? 'red' : this.severity() === 'warning' ? 'yellow' : this.severity() === 'success' ? 'green' : 'blue');
  }
}
