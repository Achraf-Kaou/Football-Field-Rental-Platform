import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Complex } from '../../../models/complex.model';
import { ComplexService } from '../../../services/complex.service';
import { DeleteModal } from '../../ui/delete-modal/delete-modal';
import { ToastService } from '../../../services/toast.service';
import { filter, forkJoin } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ReviewService, AverageRating } from '../../../services/review.service';
import { TranslateModule } from '@ngx-translate/core';

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
  selector: 'app-complex-list',
  imports: [ManagerLayout, DeleteModal, TranslateModule],
  templateUrl: './complex-list.html',
  styleUrl: './complex-list.css',
})
export class ComplexList implements OnInit {

  private complexService = inject(ComplexService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private reviewService = inject(ReviewService);

  complexes = signal<ComplexWithRating[]>([]);
  page = signal<number>(1);
  itemsPerPage = signal<number>(10);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);
  startIndex = computed(() => (this.page() * this.itemsPerPage() - 9));
  endIndex = computed(() => { 
    if (this.page() === this.totalPages()) return this.totalItems(); 
    else return (this.page() * this.itemsPerPage()) 
  });
  user = this.authService.currentUser;
  search = signal<string>('');
  status = signal<'all' | 'true' | 'false'>('all');
  sortBy = signal<string | undefined>('newest');

  showDeleteModal = signal<boolean>(false);
  complexIdToDelete = signal<number | null>(null);

  ngOnInit(): void {
    this.refetch();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.refetch();
      });
  }

  private refetch() {
    this.getComplexCount(this.user()?.id);
    this.getAllComplexes(this.page(), this.itemsPerPage(), this.search(), this.status(), this.user()?.id);
  }

  getComplexCount(userId?: number) {
    this.complexService.getComplexCount(userId).subscribe((data) => {
      this.totalItems.set(data);
      this.totalPages.set(Math.ceil(data / this.itemsPerPage()));
    });
  }

  getAllComplexes(page?: number, itemsPerPage?: number, search?: string, status?: string, userId?: number, sortBy?: string) {
    this.complexService.getAllComplexes(page, itemsPerPage, search, status, userId, sortBy).subscribe((data) => {
      console.log('Fetched complexes:', data);
      this.complexes.set(data);
      this.loadComplexRatings();
    });
  }

  /**
   * Charge les notes moyennes pour tous les complexes
   * Calcule la moyenne des reviews de tous les fields de chaque complex
   */
  private loadComplexRatings(): void {
    const complexes = this.complexes();
    console.log('Loading ratings for complexes:', complexes);
    if (!complexes || complexes.length === 0) {
      return;
    }
    console.log(`Found ${complexes.length} complexes to load ratings for.`);
    // Pour chaque complex, récupérer les ratings de tous ses fields
    complexes.forEach(complex => {
      console.log('Processing complex', complex);
      console.log('Fields:', complex.fields);
      if (complex.fields) {
        console.log(`Loading ratings for complex ${complex.id} with ${complex.fields.length} fields.`);
        this.calculateComplexRating(complex);
      }
    });
  }

  /**
   * Calcule la note moyenne d'un complex basée sur tous ses fields
   */
  private calculateComplexRating(complex: ComplexWithRating): void {
    const fieldIds = complex.fields.map(field => field.id);
    
    if (fieldIds.length === 0) {
      return;
    }
    console.log(`Calculating ratings for complex ${complex.id} with fields:`, fieldIds);
    // Récupérer les ratings de tous les fields
    const ratingRequests = fieldIds.map(fieldId => 
      this.reviewService.getFieldAverageRating(fieldId)
    );


    forkJoin(ratingRequests).subscribe({
      next: (ratings: AverageRating[]) => {
        // Calculer la moyenne globale du complex
        const validRatings = ratings.filter(r => r.totalReviews > 0);
        console.log(`Ratings for complex ${complex.id}:`, validRatings);
        if (validRatings.length === 0) {
          return;
        }

        // Calcul de la moyenne pondérée par le nombre de reviews
        let totalWeightedRating = 0;
        let totalReviewCount = 0;
        const aggregatedDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        validRatings.forEach(rating => {
          totalWeightedRating += rating.averageRating * rating.totalReviews;
          totalReviewCount += rating.totalReviews;
          
          // Agréger la distribution des notes
          Object.keys(rating.ratingDistribution).forEach(key => {
            const numKey = parseInt(key) as 1 | 2 | 3 | 4 | 5;
            aggregatedDistribution[numKey] += rating.ratingDistribution[numKey];
          });
        });

        const averageRating = totalReviewCount > 0 
          ? totalWeightedRating / totalReviewCount 
          : 0;

        // Mettre à jour le complex avec ses ratings
        this.complexes.update(complexesList => {
          const updatedList = complexesList.map(c =>
            c.id === complex.id
              ? {
                  ...c,
                  averageRating: Math.round(averageRating * 10) / 10,
                  totalReviews: totalReviewCount,
                  ratingDistribution: aggregatedDistribution
                }
              : c
          );

          console.log(
            `Loaded ratings for complex ${complex.id}: Avg=${averageRating}, TotalReviews=${totalReviewCount}`
          );

          return updatedList;
        });

      },
      error: (error) => {
        console.error(`Error loading ratings for complex ${complex.id}:`, error);
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

  addComplex() {
    this.router.navigate(['/manager/complex/new']);
  }

  editComplex(id: number) {
    if (id != null) {
      this.router.navigate(['/manager/complex', id, 'edit']);
    }
  }

  overwiewComplex(id: number) {
    this.router.navigate(['/manager/complex', id]);
  }

  handlePageChange(page: number) {
    this.page.set(page);
    this.getAllComplexes(this.page(), this.itemsPerPage(), this.search(), this.status(), this.user()?.id);
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.getAllComplexes(this.page(), this.itemsPerPage(), this.search(), this.status(), this.user()?.id);
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
      this.getAllComplexes(this.page(), this.itemsPerPage(), this.search(), this.status(), this.user()?.id);
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
    this.getAllComplexes(this.page(), this.itemsPerPage(), this.search(), this.status(), this.user()?.id);
  }

  updateStatus(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.status.set(value as 'all' | 'true' | 'false');
    this.page.set(1);
    this.getAllComplexes(this.page(), this.itemsPerPage(), '', this.status(), this.user()?.id);
  }

  updateSortBy(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.sortBy.set(value);
    this.page.set(1);
    this.getAllComplexes(this.page(), this.itemsPerPage(), '', this.status(), this.user()?.id);
  }

  handleStatus(complex: Complex): string {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const [openHour, openMin] = complex.openAt.split(':').map(Number);
    const openTimeInMinutes = openHour * 60 + openMin;

    const [closeHour, closeMin] = complex.closeAt.split(':').map(Number);
    const closeTimeInMinutes = closeHour * 60 + closeMin;

    if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes) {
      return 'Open';
    } else {
      return 'Closed';
    }
  }

  openDeleteModal(id: number) {
    this.complexIdToDelete.set(id);
    this.showDeleteModal.set(true);
  }

  cancelDelete = () => {
    this.showDeleteModal.set(false);
    this.complexIdToDelete.set(null);
  };

  confirmDelete = () => {
    const id = this.complexIdToDelete();
    if (id == null) return;

    this.complexService.deleteComplex(id).subscribe({
      next: () => {
        this.complexes.update((list) => list.filter((c) => c.id !== id));
        this.toastService.success('Complex deleted successfully.');
        this.showDeleteModal.set(false);
        this.complexIdToDelete.set(null);
        this.getComplexCount();
      },
      error: () => {
        this.toastService.error('Failed to delete complex.');
      },
    });
  };
}