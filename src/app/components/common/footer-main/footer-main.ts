import { Component } from '@angular/core';

@Component({
  selector: 'app-footer-main',
  imports: [],
  templateUrl: './footer-main.html',
  styleUrl: './footer-main.css',
})
export class FooterMain {
  year() {
    return new Date().getFullYear();
  }
}
