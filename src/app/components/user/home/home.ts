import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button';
import { CardComponent } from '../../ui/card/card';
import { InputComponent } from '../../ui/input/input';
import { NavbarMain } from '../../common/navbar-main/navbar-main';
import { FooterMain } from '../../common/footer-main/footer-main';
import { FieldService } from '../../../services/field.service';
import { ReviewService } from '../../../services/review.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { FieldModel } from '../../../models/field.model';
import { ComplexService } from '../../../services/complex.service';
import { Complex } from '../../../models/complex.model';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  private reviewService = inject(ReviewService);

  searchLocation = signal('');
  featuredFields = signal<FieldModel[]>([]);
  featuredComplexes = signal<Complex[]>([]);

  // Reviews data
  fieldRatings = signal<Map<number, { rating: number; count: number }>>(new Map());
  complexRatings = signal<Map<number, { rating: number; count: number }>>(new Map());

  page = signal(1);
  limit = signal(3);
  sortedBy = signal<string>('');

  ngOnInit(): void {
    this.getAllFields();
    this.getAllComplexes();
  }

  getAllFields() {
    this.fieldService.getAllFields(
      this.page(),
      this.limit(),
      this.searchLocation()
    ).subscribe((data) => {
      this.featuredFields.set(data);
      this.loadFieldRatings(data);
    });
  }

  getAllComplexes() {
    this.complexService.getAllComplexes(
      this.page(),
      this.limit(),
      this.searchLocation()
    ).subscribe((data) => {
      this.featuredComplexes.set(data);
      this.loadComplexRatings(data);
    });
  }

  /**
   * Load ratings for featured fields
   */
  private loadFieldRatings(fields: FieldModel[]): void {
    if (fields.length === 0) return;

    const ratingRequests = fields.map(field =>
      this.reviewService.getFieldAverageRating(field.id).pipe(
        catchError(() => of({ 
          fieldId: field.id, 
          averageRating: 0, 
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }))
      )
    );

    forkJoin(ratingRequests).subscribe({
      next: (ratings) => {
        const ratingsMap = new Map<number, { rating: number; count: number }>();
        ratings.forEach((rating, index) => {
          ratingsMap.set(fields[index].id, {
            rating: rating.averageRating,
            count: rating.totalReviews
          });
        });
        this.fieldRatings.set(ratingsMap);
      },
      error: (error) => {
        console.error('Error loading field ratings:', error);
      }
    });
  }

  /**
   * Load average ratings for complexes based on their fields
   */
  private loadComplexRatings(complexes: Complex[]): void {
    if (complexes.length === 0) return;

    const complexRatingRequests = complexes.map(complex => {
      if (!complex.fields || complex.fields.length === 0) {
        return of({ complexId: complex.id, rating: 0, count: 0 });
      }

      // Get ratings for all fields in this complex
      const fieldRatingRequests = complex.fields.map(field =>
        this.reviewService.getFieldAverageRating(field.id).pipe(
          catchError(() => of({
            fieldId: field.id,
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          }))
        )
      );

      return forkJoin(fieldRatingRequests).pipe(
        map(fieldRatings => {
          // Calculate average rating across all fields
          const validRatings = fieldRatings.filter(r => r.totalReviews > 0);
          
          if (validRatings.length === 0) {
            return { complexId: complex.id, rating: 0, count: 0 };
          }

          const totalRating = validRatings.reduce((sum, r) => sum + r.averageRating, 0);
          const totalReviews = validRatings.reduce((sum, r) => sum + r.totalReviews, 0);
          const averageRating = totalRating / validRatings.length;

          return {
            complexId: complex.id,
            rating: averageRating,
            count: totalReviews
          };
        }),
        catchError(() => of({ complexId: complex.id, rating: 0, count: 0 }))
      );
    });

    forkJoin(complexRatingRequests).subscribe({
      next: (complexRatings) => {
        const ratingsMap = new Map<number, { rating: number; count: number }>();
        complexRatings.forEach(rating => {
          ratingsMap.set(rating.complexId, {
            rating: rating.rating,
            count: rating.count
          });
        });
        this.complexRatings.set(ratingsMap);
      },
      error: (error) => {
        console.error('Error loading complex ratings:', error);
      }
    });
  }

  /**
   * Get rating for a specific field
   */
  getFieldRating(fieldId: number): number {
    return this.fieldRatings().get(fieldId)?.rating || 0;
  }

  /**
   * Get review count for a specific field
   */
  getFieldReviewCount(fieldId: number): number {
    return this.fieldRatings().get(fieldId)?.count || 0;
  }

  /**
   * Get formatted rating for a field
   */
  getFormattedFieldRating(fieldId: number): string {
    const rating = this.getFieldRating(fieldId);
    return rating > 0 ? this.reviewService.formatRating(rating) : 'N/A';
  }

  /**
   * Get rating for a specific complex
   */
  getComplexRating(complexId: number): number {
    return this.complexRatings().get(complexId)?.rating || 0;
  }

  /**
   * Get total review count for a complex
   */
  getComplexReviewCount(complexId: number): number {
    return this.complexRatings().get(complexId)?.count || 0;
  }

  /**
   * Get formatted rating for a complex
   */
  getFormattedComplexRating(complexId: number): string {
    const rating = this.getComplexRating(complexId);
    return rating > 0 ? this.reviewService.formatRating(rating) : 'N/A';
  }

  /**
   * Get star icons for a field's rating
   */
  getFieldStarIcons(fieldId: number): ('full' | 'half' | 'empty')[] {
    const rating = this.getFieldRating(fieldId);
    return this.reviewService.getStarIcons(rating);
  }

  /**
   * Get star icons for a complex's rating
   */
  getComplexStarIcons(complexId: number): ('full' | 'half' | 'empty')[] {
    const rating = this.getComplexRating(complexId);
    return this.reviewService.getStarIcons(rating);
  }

  /**
   * Get rating color class for a field
   */
  getFieldRatingColorClass(fieldId: number): string {
    const rating = this.getFieldRating(fieldId);
    return this.reviewService.getRatingColorClass(rating);
  }

  /**
   * Get rating color class for a complex
   */
  getComplexRatingColorClass(complexId: number): string {
    const rating = this.getComplexRating(complexId);
    return this.reviewService.getRatingColorClass(rating);
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