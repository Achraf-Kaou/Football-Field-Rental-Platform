import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/ui/toast/toast';
import { PrimeNG } from 'primeng/config';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private primeng = inject(PrimeNG);
  protected readonly title = signal('Takwirti');

  ngOnInit() {
    this.primeng.ripple.set(true);
  }
}
