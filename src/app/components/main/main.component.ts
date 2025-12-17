import { Component } from '@angular/core';
import { FooterMain } from '../common/footer-main/footer-main';
import { NavbarMain } from '../common/navbar-main/navbar-main';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-main',
  imports: [FooterMain, NavbarMain, MatIconModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  heroSectionImage = 'src/assets/hero-section.png';
}
