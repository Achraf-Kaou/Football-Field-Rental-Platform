import { Component, computed, inject, signal, DestroyRef } from '@angular/core';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private destroyRef = inject(DestroyRef);

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

  // Stats
  totalComplexes = computed(() => this.complexes().length);
  totalFields = computed(() => this.fields().length);
  totalBookings = computed(() => this.bookings().length);

  // Auth
  managerId = computed(() => this.auth.currentUser()?.id ?? null);
  isManager = computed(() => this.auth.currentUser()?.role === 'MANAGER');

  // Stabiliser l'id sélectionné si besoin
  selectedComplexId = computed<number | null>(() => this.selectedComplex()?.id ?? null);

  constructor() {
    this.init();
  }

  private init() {
    if (!this.isManager()) {
      this.error.set('Accès refusé: vous devez être MANAGER.');
      this.loading.set(false);
      return;
    }

    const userId = this.managerId();
    if (!userId) {
      this.error.set("Utilisateur non connecté.");
      this.loading.set(false);
      return;
    }

    this.loadComplexes();
  }

  // ====== LOADERS ======

  loadComplexes() {
    const userId = this.managerId();
    if (!userId) return;

    this.loading.set(true);
    this.error.set(null);

    const page = 1;
    const itemsPerPage = 50;

    this.complexService
      .getAllComplexes(
        page,
        itemsPerPage,
        this.search() || undefined,
        this.status() || undefined,
        userId,
        this.sortBy() || undefined
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (complexes) => {
          const list = complexes || [];
          this.complexes.set(list);

          // si aucun sélectionné, sélectionner le 1er + charger ses données
          if (!this.selectedComplexId() && list.length > 0) {
            this.selectComplex(list[0]);
          }

          // si le sélectionné n'existe plus dans la liste, fallback
          const currentId = this.selectedComplexId();
          if (currentId && !list.some(c => c.id === currentId)) {
            if (list[0]) this.selectComplex(list[0]);
            else this.clearDetails();
          }

          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message || 'Erreur lors du chargement des complexes');
          this.loading.set(false);
        }
      });
  }

  private loadFields(complexId: number) {
    this.fieldService
      .getAllFields(undefined, undefined, undefined, undefined, undefined, complexId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fields) => {
          const list = fields || [];
          this.fields.set(list);
          this.prefetchRatings(list);
        },
        error: (err) => {
          this.error.set(err?.message || 'Erreur lors du chargement des terrains');
        }
      });
  }

  private loadBookings(complexId: number) {
    this.bookingService
      .getBookingsByComplexId(complexId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (bookings) => this.bookings.set(bookings || []),
        error: (err) => {
          this.error.set(err?.message || 'Erreur lors du chargement des réservations');
        }
      });
  }

  private prefetchRatings(fields: FieldModel[]) {
    if (!fields?.length) {
      this.ratingsMap.set({});
      return;
    }

    const requests = fields.map(f => this.reviewService.getFieldAverageRating(f.id));
    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const map: Record<number, AverageRating> = {};
          results.forEach((avg, idx) => {
            map[fields[idx].id] = avg;
          });
          this.ratingsMap.set(map);
        },
        error: () => this.ratingsMap.set({})
      });
  }

  private clearDetails() {
    this.selectedComplex.set(null);
    this.fields.set([]);
    this.bookings.set([]);
    this.ratingsMap.set({});
  }

  // ====== UI ACTIONS ======

  selectComplex(c: Complex) {
    if (this.selectedComplexId() === c.id) return;

    this.selectedComplex.set(c);

    // au click => charger les détails
    this.fields.set([]);
    this.bookings.set([]);
    this.ratingsMap.set({});

    this.loadFields(c.id);
    this.loadBookings(c.id);
  }

  // ====== FILTER HANDLERS ======

  onStatusChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.status.set(target.value || null);
    this.loadComplexes();
  }

  onSortByChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.sortBy.set(target.value);
    this.loadComplexes();
  }

  // optionnel: si tu veux déclencher la recherche "en live"
  onSearchChange(value: string) {
    this.search.set(value);
    this.loadComplexes();
  }

  // ====== UI HELPERS ======

  ratingFor(fieldId: number): AverageRating | null {
    return this.ratingsMap()[fieldId] ?? null;
  }

  starIconsFor(fieldId: number): ('full' | 'half' | 'empty')[] {
    const value = this.ratingFor(fieldId)?.averageRating ?? 0;
    return this.reviewService.getStarIcons(value);
  }

  ratingTextFor(fieldId: number): string {
    const value = this.ratingFor(fieldId)?.averageRating ?? 0;
    return this.reviewService.getRatingText(value);
  }

  ratingColorClassFor(fieldId: number): string {
    const value = this.ratingFor(fieldId)?.averageRating ?? 0;
    return this.reviewService.getRatingColorClass(value);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  trackById(_: number, item: { id: number }) {
    return item.id;
  }
}