import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button';
import { CardComponent } from '../../ui/card/card';
import { FooterMain } from '../../common/footer-main/footer-main';
import { NavbarMain } from '../../common/navbar-main/navbar-main';
import { ComplexService } from '../../../services/complex.service';
import { Complex } from '../../../models/complex.model';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-complex-list',
  standalone: true,
  imports: [CommonModule, ButtonComponent, CardComponent, NavbarMain, FooterMain, TranslateModule],
  templateUrl: './complex-list.html',
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
export class ComplexList implements OnInit {
  private complexService = inject(ComplexService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // Filter signals
  searchQuery = signal('');
  statusFilter = signal<string>('');
  
  // Pagination signals
  page = signal<number>(1);
  itemsPerPage = signal<number>(9);
  totalItems = signal<number>(0);
  
  // UI state
  showMobileFilters = signal(false);
  isLoading = signal(false);
  
  // Data
  complexes = signal<Complex[]>([]);

  // Computed values
  totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage()));
  startIndex = computed(() => (this.page() - 1) * this.itemsPerPage() + 1);
  endIndex = computed(() => {
    const end = this.page() * this.itemsPerPage();
    return end > this.totalItems() ? this.totalItems() : end;
  });

  // Check if any filters are active
  hasActiveFilters = computed(() => {
    return this.statusFilter() !== '' || this.searchQuery() !== '';
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
    this.loadComplexes();
  }

  /**
   * Load complexes with current filters and pagination
   */
  loadComplexes(): void {
    this.isLoading.set(true);
    
    const searchValue = this.searchQuery() || undefined;
    const statusValue = this.statusFilter() && this.statusFilter() !== 'all' ? this.statusFilter() : undefined;
    
    this.complexService.getComplexCount().subscribe((count) => {
      this.totalItems.set(count);
    });
    
    this.complexService.getAllComplexes(
      this.page(),
      this.itemsPerPage(),
      searchValue,
      statusValue
    ).subscribe({
      next: (response: any) => {
        // Check if response has pagination data
        const complexesData = response.data ? response.data : response;
        this.complexes.set(complexesData);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading complexes:', error);
        this.toastService.error('Failed to load complexes', 3000);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Apply filters
   */
  filter(): void {
    this.page.set(1); // Reset to first page when filtering
    this.loadComplexes();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.showMobileFilters.set(false);
    this.page.set(1);
    this.loadComplexes();
  }

  /**
   * Toggle mobile filters
   */
  toggleMobileFilters(): void {
    this.showMobileFilters.update(v => !v);
  }

  /**
   * Navigate to complex fields
   */
  viewComplexFields(complexId: number): void {
    this.router.navigate(['/user/fields'], { queryParams: { complexId } });
  }

  /**
   * Go to previous page
   */
  prevPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadComplexes();
      this.scrollToTop();
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      this.loadComplexes();
      this.scrollToTop();
    }
  }

  /**
   * Go to specific page
   */
  goToPage(pageNum: number): void {
    if (pageNum >= 1 && pageNum <= this.totalPages() && pageNum !== this.page()) {
      this.page.set(pageNum);
      this.loadComplexes();
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

  /**
   * Get formatted time for display
   */
  getFormattedTime(time: string): string {
    if (!time) return 'N/A';
    return time.substring(0, 5); // Format HH:MM
  }
}
