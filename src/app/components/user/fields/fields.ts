import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button';
import { CardComponent } from '../../ui/card/card';
import { FooterMain } from '../../common/footer-main/footer-main';
import { NavbarMain } from '../../common/navbar-main/navbar-main';
import { FieldService } from '../../../services/field.service';
import { ReviewService } from '../../../services/review.service';
import { FieldModel } from '../../../models/field.model';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-fields',
  standalone: true,
  imports: [CommonModule, ButtonComponent, CardComponent, NavbarMain, FooterMain],
  templateUrl: './fields.html',
  styles: [`
    @keyframes slide-down {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-slide-down {
      animation: slide-down 0.3s ease-out;
    }

    .line-clamp-1 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }

    .line-clamp-2 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    select:focus {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2349E619' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    }
  `]
})
export class Fields implements OnInit {
  private fieldService = inject(FieldService);
  private reviewService = inject(ReviewService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // Filter signals
  searchQuery = signal('');
  typeFilter = signal<string>('');
  
  // Pagination signals
  page = signal<number>(1);
  itemsPerPage = signal<number>(9);
  totalItems = signal<number>(0);
  
  // UI state
  showMobileFilters = signal(false);
  isLoading = signal(false);
  
  // Data
  fields = signal<FieldModel[]>([]);
  complexId = signal<number | null>(null);
  
  // Reviews data
  fieldRatings = signal<Map<number, { rating: number; count: number }>>(new Map());

  // Computed values
  totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage()));
  startIndex = computed(() => (this.page() - 1) * this.itemsPerPage() + 1);
  endIndex = computed(() => {
    const end = this.page() * this.itemsPerPage();
    return end > this.totalItems() ? this.totalItems() : end;
  });

  // Check if any filters are active
  hasActiveFilters = computed(() => {
    return this.typeFilter() !== '' || this.searchQuery() !== '';
  });

  // Get visible page numbers for pagination
  visiblePages = computed(() => {
    const current = this.page();
    const total = this.totalPages();
    const delta = 2; // Number of pages to show on each side
    
    let pages: number[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      pages.push(i);
    }
    
    // Always show last page if there is more than one page
    if (total > 1) {
      pages.push(total);
    }
    
    // Remove duplicates and sort
    return [...new Set(pages)].sort((a, b) => a - b);
  });

  ngOnInit(): void {
    this.loadFields();
  }

  /**
   * Load fields with current filters and pagination
   */
  loadFields(): void {
    this.isLoading.set(true);
    
    const searchValue = this.searchQuery() || undefined;
    const typeValue = this.typeFilter() && this.typeFilter() !== 'all' ? this.typeFilter() : undefined;
    
    this.fieldService.countAll(this.complexId() || undefined).subscribe((count) => {
      this.totalItems.set(count);
    });
    
    this.fieldService.getAllFields(
      this.page(),
      this.itemsPerPage(),
      searchValue,
      undefined,
      undefined,
      undefined,
      undefined,
      typeValue
    ).subscribe({
      next: (response: any) => {
        // Check if response has pagination data
        const fieldsData = response.data ? response.data : response;
        this.fields.set(fieldsData);
        
        // Load ratings for all fields
        this.loadFieldRatings(fieldsData);
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading fields:', error);
        this.toastService.error('Failed to load fields', 3000);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Load ratings for all fields
   */
  private loadFieldRatings(fields: FieldModel[]): void {
    if (fields.length === 0) return;

    const ratingRequests = fields.map(field => 
      this.reviewService.getFieldAverageRating(field.id)
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
        console.error('Error loading ratings:', error);
        // Don't show error to user, just keep default rating
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
   * Get formatted rating for display
   */
  getFormattedRating(fieldId: number): string {
    const rating = this.getFieldRating(fieldId);
    return rating > 0 ? this.reviewService.formatRating(rating) : 'N/A';
  }

  /**
   * Get star icons for a field's rating
   */
  getStarIcons(fieldId: number): ('full' | 'half' | 'empty')[] {
    const rating = this.getFieldRating(fieldId);
    return this.reviewService.getStarIcons(rating);
  }

  /**
   * Get rating color class for a field
   */
  getRatingColorClass(fieldId: number): string {
    const rating = this.getFieldRating(fieldId);
    return this.reviewService.getRatingColorClass(rating);
  }

  /**
   * Apply filters
   */
  filter(): void {
    this.page.set(1); // Reset to first page when filtering
    this.loadFields();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchQuery.set('');
    this.typeFilter.set('');
    this.showMobileFilters.set(false);
    this.page.set(1);
    this.loadFields();
  }

  /**
   * Toggle mobile filters
   */
  toggleMobileFilters(): void {
    this.showMobileFilters.update(v => !v);
  }

  /**
   * Navigate to booking page
   */
  goToBooking(id: number): void {
    this.router.navigate(['/user/booking', id]);
  }

  /**
   * Go to previous page
   */
  prevPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadFields();
      this.scrollToTop();
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      this.loadFields();
      this.scrollToTop();
    }
  }

  /**
   * Go to specific page
   */
  goToPage(pageNum: number): void {
    if (pageNum >= 1 && pageNum <= this.totalPages() && pageNum !== this.page()) {
      this.page.set(pageNum);
      this.loadFields();
      this.scrollToTop();
    }
  }

  /**
   * Scroll to top of page
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Check if there should be ellipsis before a page number
   */
  shouldShowEllipsisBefore(pageNum: number): boolean {
    const pages = this.visiblePages();
    const index = pages.indexOf(pageNum);
    if (index > 0) {
      return pages[index] - pages[index - 1] > 1;
    }
    return false;
  }
}