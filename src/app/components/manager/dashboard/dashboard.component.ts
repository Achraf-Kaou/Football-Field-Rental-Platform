import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ComplexService } from '../../../services/complex.service';
import { FieldService } from '../../../services/field.service';
import { BookingService } from '../../../services/booking.service';
import { ReviewService, AverageRating } from '../../../services/review.service';
import { Complex } from '../../../models/complex.model';
import { FieldModel } from '../../../models/field.model';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ManagerLayout } from "../../layouts/manager-layout/manager-layout";

@Component({
  standalone: true,
  selector: 'app-manager-dashboard',
  imports: [CommonModule, FormsModule, RouterLink, ManagerLayout],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private auth = inject(AuthService);
  private complexService = inject(ComplexService);
  private fieldService = inject(FieldService);
  private bookingService = inject(BookingService);
  private reviewService = inject(ReviewService);

  // UI state
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filters
  search = signal<string>('');
  status = signal<string | null>(null);
  sortBy = signal<string>('createdAt');

  // Data
  complexes = signal<Complex[]>([]);
  selectedComplex = signal<Complex | null>(null);

  fields = signal<FieldModel[]>([]);
  bookings = signal<any[]>([]);

  // Ratings par terrain (fieldId -> AverageRating)
  ratingsMap = signal<Record<number, AverageRating>>({});

  // Stats globales
  totalComplexes = computed(() => this.complexes().length);
  totalFields = computed(() => this.fields().length);
  totalBookings = computed(() => this.bookings().length);

  // Id du manager (depuis auth)
  managerId = computed(() => this.auth.currentUser()?.id ?? null);
  isManager = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'MANAGER' || role === 'ADMIN';
  });

  constructor() {
    // Charger complexes au démarrage
    effect(() => {
      if (!this.isManager()) {
        this.error.set('Accès refusé: vous devez être MANAGER ou ADMIN.');
        this.loading.set(false);
        return;
      }
      const userId = this.managerId();
      if (!userId) return;

      this.fetchComplexes(userId);
    });

    // Quand on change de complex sélectionné, charger ses terrains et réservations
    effect(() => {
      const complex = this.selectedComplex();
      if (complex?.id) {
        this.fetchFields(complex.id);
        this.fetchBookings(complex.id);
      } else {
        this.fields.set([]);
        this.bookings.set([]);
        this.ratingsMap.set({});
      }
    });

    // Rafraîchir quand on change recherche/status/sort
    effect(() => {
      const userId = this.managerId();
      if (!userId) return;
      // On relance la requête complexes quand filtres changent
      this.fetchComplexes(userId);
    });
  }

  private fetchComplexes(userId: number) {
    this.loading.set(true);
    this.error.set(null);

    const page = 1;
    const itemsPerPage = 50;
    const search = this.search() || undefined;
    const status = this.status() || undefined;
    const sortBy = this.sortBy() || undefined;

    this.complexService
      .getAllComplexes(page, itemsPerPage, search, status ?? undefined, userId, sortBy)
      .subscribe({
        next: (complexes) => {
          this.complexes.set(complexes || []);
          // sélection automatique du premier complex
          if (complexes && complexes.length > 0) {
            this.selectedComplex.set(complexes[0]);
          } else {
            this.selectedComplex.set(null);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message || 'Erreur lors du chargement des complexes');
          this.loading.set(false);
        }
      });
  }

  private fetchFields(complexId: number) {
    this.fieldService.getAllFields(undefined, undefined, undefined, undefined, undefined, complexId)
      .subscribe({
        next: (fields) => {
          this.fields.set(fields || []);
          this.prefetchRatings(fields || []);
        },
        error: (err) => {
          this.error.set(err?.message || 'Erreur lors du chargement des terrains');
        }
      });
  }

  private fetchBookings(complexId: number) {
    this.bookingService.getBookingsByComplexId(complexId)
      .subscribe({
        next: (bookings) => {
          this.bookings.set(bookings || []);
        },
        error: (err) => {
          this.error.set(err?.message || 'Erreur lors du chargement des réservations');
        }
      });
  }

  // Précharger les ratings pour chaque terrain
  private prefetchRatings(fields: FieldModel[]) {
    if (!fields || fields.length === 0) {
      this.ratingsMap.set({});
      return;
    }
    const requests = fields.map(f => this.reviewService.getFieldAverageRating(f.id));
    forkJoin(requests).subscribe({
      next: (results) => {
        const map: Record<number, AverageRating> = {};
        results.forEach((avg, idx) => {
          const fieldId = fields[idx].id;
          map[fieldId] = avg;
        });
        this.ratingsMap.set(map);
      },
      error: () => {
        this.ratingsMap.set({});
      }
    });
  }

  // UI actions
  selectComplex(c: Complex) {
    this.selectedComplex.set(c);
  }

  // Event handlers
  onStatusChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.status.set(target.value || null);
  }

  onSortByChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.sortBy.set(target.value);
  }

  // Helpers UI
  ratingFor(fieldId: number): AverageRating | null {
    return this.ratingsMap()[fieldId] ?? null;
  }

  starIconsFor(fieldId: number): ('full' | 'half' | 'empty')[] {
    const avg = this.ratingFor(fieldId);
    const value = avg?.averageRating ?? 0;
    return this.reviewService.getStarIcons(value);
  }

  ratingTextFor(fieldId: number): string {
    const avg = this.ratingFor(fieldId);
    const value = avg?.averageRating ?? 0;
    return this.reviewService.getRatingText(value);
  }

  ratingColorClassFor(fieldId: number): string {
    const avg = this.ratingFor(fieldId);
    const value = avg?.averageRating ?? 0;
    return this.reviewService.getRatingColorClass(value);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
}