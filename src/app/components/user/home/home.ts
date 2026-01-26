import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button';
import { CardComponent } from '../../ui/card/card';
import { InputComponent } from '../../ui/input/input';
import { NavbarMain } from '../../common/navbar-main/navbar-main';
import { FooterMain } from '../../common/footer-main/footer-main';
import { FieldService } from '../../../services/field.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { FieldModel } from '../../../models/field.model';
import { ComplexService } from '../../../services/complex.service';
import { Complex } from '../../../models/complex.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonComponent, CardComponent, InputComponent, NavbarMain, FooterMain],
  templateUrl: './home.html',
  styles: [`
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fade-in 0.6s ease-out;
    }
  `]
})
export class Home implements OnInit {
  private router = inject(Router);
  private fieldService = inject(FieldService);
  private complexService = inject(ComplexService);

  searchLocation = signal('');
  featuredFields = signal<FieldModel[]>([]);
  featuredComplexes = signal<Complex[]>([]);

  page = signal(1);
  limit = signal(3);
  sortedBy = signal<string>('')


  ngOnInit(): void {
    this.getAllFields();
    this.getAllComplexes();
  }

  getAllFields() {
    this.fieldService.getAllFields(
      this.page(),
      this.limit(),
      this.searchLocation()).subscribe((data) => {
        this.featuredFields.set(data);
      });
  }

  getAllComplexes() {
    this.complexService.getAllComplexes(
      this.page(),
      this.limit(),
      this.searchLocation()).subscribe((data) => {
        this.featuredComplexes.set(data);
      });
  }

  search() {
    this.page.set(1);
    this.limit.set(3);
    this.getAllFields();
    this.getAllComplexes();
  }

  goToFields() {
    this.router.navigate(['/user/fields']);
  }

  goToComplexes() {
    this.router.navigate(['/user/complexes']);
  }

  goToBooking(idField: number) {
    this.router.navigate(['/user/booking', idField]);
  }

  goToComplex(idComplex: number) {
    this.router.navigate(['/user/complex', idComplex]);
  }
}
