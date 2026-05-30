import { Component, inject } from '@angular/core';
import { FooterMain } from '../common/footer-main/footer-main';
import { NavbarMain } from '../common/navbar-main/navbar-main';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-main',
  imports: [FooterMain, NavbarMain, MatIconModule, TranslateModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  private router = inject(Router);

  handleButtonClick() {
    this.router.navigate(['/login']);
  }
}
