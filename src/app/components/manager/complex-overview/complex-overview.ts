import { Component, computed, DestroyRef, inject, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { Complex } from '../../../models/complex.model';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ComplexService } from '../../../services/complex.service';
import { FieldService } from '../../../services/field.service';
import { ToastService } from '../../../services/toast.service';
import { FieldModel } from '../../../models/field.model';
import { DeleteModal } from '../../ui/delete-modal/delete-modal';
import { ReviewService, AverageRating } from '../../../services/review.service';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

interface FieldWithRating extends FieldModel {
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ComplexWithRating extends Complex {
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

@Component({
  selector: 'app-complex-overview',
  imports: [ManagerLayout, DeleteModal, TranslateModule],
  templateUrl: './complex-overview.html',
  styleUrl: './complex-overview.css',
})
export class ComplexOverview implements OnInit, OnChanges {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private complexService = inject(ComplexService);
  private fieldService = inject(FieldService);
  private toastService = inject(ToastService);
  private reviewService = inject(ReviewService);

  complex = signal<ComplexWithRating | null>(null);
  complexId = signal<number | null>(null);
  fieldsCount = signal<number>(0);
  fields = signal<FieldWithRating[]>([]);

  page = signal<number>(1);
  itemsPerPage = signal<number>(10);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);
  startIndex = computed(() => (this.page() * this.itemsPerPage() - 9));
  endIndex = computed(() => {
    if (this.page() === this.totalPages()) return this.totalItems();
    else return (this.page() * this.itemsPerPage())
  });

  search = signal<string>('')
  sortedBy = signal<string>('')
  sortedDirection = signal<'asc' | 'desc'>('desc')
  status = signal<string>('')
  type = signal<string>('')

  showDeleteModal = signal<boolean>(false);
  fieldIdToDelete = signal<number | null>(null);

  ngOnInit(): void {
    // Écoutez les changements de paramètres dans la route
    this.route.paramMap.subscribe(params => {
      const complexId = +params.get('id')!;
      this.complexId.set(complexId); // Définir le nouvel ID
      this.reloadComplexData(); // Recharger les données en fonction du nouvel ID
    });

    // Si une navigation ramène au même composant, rechargez les données
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.reloadComplexData();
      }
    });
  }

  private reloadComplexData(): void {
    const complexId = this.complexId();

    if (!complexId) {
      return;
    }

    // Recharge les données du complexe
    this.getComplexById(complexId);

    // Recharge le compte des fields
    this.countComplexFields(complexId);

    // Recharge les fields
    this.getFieldsByComplexId(
      this.page(),
      this.itemsPerPage(),
      this.search(),
      this.sortedBy(),
      this.sortedDirection(),
      complexId,
      this.status(),
      this.type()
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.ngOnInit();
  }

  getComplexById(id: number | null) {
    if (id === null) {
      this.toastService.error('complex with this id not found', 3000);
      return;
    }
    this.complexService.getComplexById(id).subscribe((data) => {
      this.complex.set(data);
      this.loadComplexRating(data);
    });
  }

  /**
   * Charge la note moyenne du complexe basée sur tous ses fields
   */
  private loadComplexRating(complex: Complex): void {
    if (!complex.fields || complex.fields.length === 0) {
      return;
    }

    const fieldIds = complex.fields.map(field => field.id);
    const ratingRequests = fieldIds.map(fieldId =>
      this.reviewService.getFieldAverageRating(fieldId)
    );

    forkJoin(ratingRequests).subscribe({
      next: (ratings: AverageRating[]) => {
        const validRatings = ratings.filter(r => r.totalReviews > 0);

        if (validRatings.length === 0) {
          return;
        }

        let totalWeightedRating = 0;
        let totalReviewCount = 0;
        const aggregatedDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        validRatings.forEach(rating => {
          totalWeightedRating += rating.averageRating * rating.totalReviews;
          totalReviewCount += rating.totalReviews;

          Object.keys(rating.ratingDistribution).forEach(key => {
            const numKey = parseInt(key) as 1 | 2 | 3 | 4 | 5;
            aggregatedDistribution[numKey] += rating.ratingDistribution[numKey];
          });
        });

        const averageRating = totalReviewCount > 0
          ? totalWeightedRating / totalReviewCount
          : 0;

        this.complex.update(current => {
          if (!current) return current;
          return {
            ...current,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: totalReviewCount,
            ratingDistribution: aggregatedDistribution
          };
        });
      },
      error: (error) => {
        console.error('Error loading complex ratings:', error);
      }
    });
  }

  countComplexFields(id?: number | null) {
    if (id)
      return this.fieldService.countAll(id).subscribe((data) => {
        this.totalItems.set(data);
        this.totalPages.set(Math.ceil(data / this.itemsPerPage()));
      });
    return this.fieldService.countAll().subscribe((data) => {
      this.totalItems.set(data);
      this.totalPages.set(Math.ceil(data / this.itemsPerPage()));
    });
  }

  getFieldsByComplexId(page?: number, limit?: number, search?: string, sortedBy?: string, sortedDirection?: string, complexId?: number | null, status?: string, type?: string) {
  if (complexId === null) {
    this.toastService.error('Le complexe avec cet ID est introuvable.', 3000);
    return;
  }

  this.fieldService.getAllFields(page, limit, search, sortedBy, undefined, complexId, status, type).subscribe({
    next: (data) => {
      console.log('Données des Fields:', data);

      // Force la réactivité en copiant les données reçues
      this.fields.set([...data]);
      this.loadFieldsRatings(); // Recharge les notes des fields
    },
    error: (err) => {
      this.toastService.error('Erreur lors de la récupération des fields : ' + err.message, 3000);
    }
  });
  }

  /**
   * Charge les notes moyennes pour tous les fields affichés
   */
  private loadFieldsRatings(): void {
    const fields = this.fields();

    if (!fields || fields.length === 0) {
      return;
    }

    fields.forEach(field => {
      this.loadFieldRating(field);
    });
  }

  /**
   * Charge la note moyenne d'un field spécifique
   */
  private loadFieldRating(field: FieldWithRating): void {
    this.reviewService.getFieldAverageRating(field.id).subscribe({
      next: (rating: AverageRating) => {
        if (rating.totalReviews === 0) {
          return;
        }

        this.fields.update(fieldsList =>
          fieldsList.map(f =>
            f.id === field.id
              ? {
                ...f,
                averageRating: Math.round(rating.averageRating * 10) / 10,
                totalReviews: rating.totalReviews,
                ratingDistribution: rating.ratingDistribution
              }
              : f
          )
        );
      },
      error: (error) => {
        console.error(`Error loading rating for field ${field.id}:`, error);
      }
    });
  }

  /**
   * Obtient les icônes d'étoiles pour affichage
   */
  getStarIcons(rating: number): ('full' | 'half' | 'empty')[] {
    return this.reviewService.getStarIcons(rating);
  }

  /**
   * Obtient la classe CSS pour la couleur de la note
   */
  getRatingColorClass(rating: number): string {
    return this.reviewService.getRatingColorClass(rating);
  }

  /**
   * Obtient le texte descriptif de la note
   */
  getRatingText(rating: number): string {
    return this.reviewService.getRatingText(rating);
  }

  /**
   * Formate la note pour l'affichage
   */
  formatRating(rating: number): string {
    return this.reviewService.formatRating(rating);
  }

  editComplex() {
    const id = this.complexId();
    if (id != null) {
      this.router.navigate(['/manager/complex', id, 'edit']);
    }
  }

  addField() {
    this.router.navigate(['/manager/complex', this.complexId(), 'field', 'new']);
  }

  editField(id: number) {
    this.router.navigate(['/manager/complex', this.complexId(), 'field', id, 'edit']);
  }

  deleteField(id: number) {
    this.fieldIdToDelete.set(id);
    this.showDeleteModal.set(true);
  }

  // passed to modal
  cancelDelete = () => {
    this.showDeleteModal.set(false);
    this.fieldIdToDelete.set(null);
  };

  confirmDelete = () => {
    const id = this.fieldIdToDelete();
    if (id == null) return;

    this.fieldService.deleteField(id).subscribe({
      next: () => {
        this.fields.update((list) => list.filter((f) => f.id !== id));
        this.toastService.success('Field deleted successfully.');
        this.showDeleteModal.set(false);
        this.fieldIdToDelete.set(null);
        this.countComplexFields();
        
        // Recalculer la note du complexe après suppression d'un field
        const complex = this.complex();
        if (complex) {
          this.loadComplexRating(complex);
        }
      },
      error: () => {
        this.toastService.error('Failed to delete field.');
      },
    });
  };

  get heroBackground(): string {
    const images = this.complex()?.images;
    const url = images?.[1] || images?.[0] || '';
    return `
      linear-gradient(
        0deg,
        rgba(21, 33, 17, 0.9) 0%,
        rgba(21, 33, 17, 0.2) 60%,
        rgba(21, 33, 17, 0) 100%
      ),
      url("${url}")
    `;
  }

  statusColor(field: FieldModel): string {
    const status = field?.status;
    switch (status) {
      case 'available':
        return 'bg-green text-green-800';
      case 'closed':
        return 'bg-red text-red-800';
      case 'maintenance':
        return 'bg-orange text-orange-800';
      default:
        return 'bg-gray text-gray-800';
    }
  }

  handlePageChange(page: number) {
    this.page.set(page);
    this.getFieldsByComplexId(this.page(), this.itemsPerPage(), undefined, undefined, undefined, this.complexId(), undefined, undefined);
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.getFieldsByComplexId(this.page(), this.itemsPerPage());
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
      this.getFieldsByComplexId(this.page(), this.itemsPerPage())
    }
  }

  generateRange(start: number, end: number): number[] {
    const list = [];
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }

  updateSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.getFieldsByComplexId(this.page(), this.itemsPerPage(), this.search(), this.sortedBy(), this.sortedDirection(), this.complexId(), this.status(), this.type());
  }

  updateStatus(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.status.set(value as '' | 'available' | 'maintenance' | 'closed');
    this.page.set(1);
    this.getFieldsByComplexId(this.page(), this.itemsPerPage(), this.search(), this.sortedBy(), this.sortedDirection(), this.complexId(), this.status(), this.type());
  }

  updateType(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.type.set(value as '' | '5' | '6' | '7' | '11');
    this.page.set(1);
    this.getFieldsByComplexId(this.page(), this.itemsPerPage(), this.search(), this.sortedBy(), this.sortedDirection(), this.complexId(), this.status(), this.type());
  }
}