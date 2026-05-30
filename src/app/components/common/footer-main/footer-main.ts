import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer-main',
  imports: [],
  templateUrl: './footer-main.html',
  styleUrl: './footer-main.css',
})
export class FooterMain {
  private router = inject(Router);

  handleButtonClick() {
    this.router.navigate(['/login']);
  }

  year() {
    return new Date().getFullYear();
  }
}
