import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { Router, RouterLink } from '@angular/router';
import { Complex } from '../../../models/complex.model';
import { ComplexService } from '../../../services/complex.service';
import { DeleteModal } from '../../ui/delete-modal/delete-modal';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-complex-list',
  imports: [ManagerLayout, DeleteModal],
  templateUrl: './complex-list.html',
  styleUrl: './complex-list.css',
})
export class ComplexList implements OnInit {

  private complexService = inject(ComplexService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  

  complexes = signal<Complex[]>([]);
  page = signal<number>(1);
  itemsPerPage = signal<number>(10);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);
  startIndex = computed(() => (this.page() * this.itemsPerPage() - 9));
  endIndex = computed(() => { if (this.page() === this.totalPages()) return this.totalItems(); else return (this.page() * this.itemsPerPage()) });

  search = signal<string>('');
  status = signal<'all' | 'true' | 'false'>('all');
  sortBy = signal<string>('newest');

  showDeleteModal = signal<boolean>(false);
  complexIdToDelete = signal<number | null>(null);


  ngOnInit(): void {
    this.getComplexCount();
    this.getAllComplexes(this.page(), this.itemsPerPage());
    console.log(this.complexes());
  }

  getComplexCount() {
    this.complexService.getComplexCount().subscribe((data) => {
      this.totalItems.set(data);
      this.totalPages.set(Math.ceil(data / this.itemsPerPage()));
    });
  }

  getAllComplexes(page?: number, itemsPerPage?: number, search?: string, status?: string, sortBy?: string) {
    this.complexService.getAllComplexes(page, itemsPerPage, search, status, sortBy).subscribe((data) => {
      this.complexes.set(data);
    });
    console.log(this.complexes());
  }

  addComplex() {
    this.router.navigate(['/manager/complex/new']);
  }

  editComplex(id: number) {
    if (id != null) {
      this.router.navigate(['/manager/complex', id, 'edit']);
    }
  }

  availabilityCalender(id: number) {
    if (id != null) {
      this.router.navigate(['/manager/field-availability', id]);
    }
}

  overwiewComplex(id: number) {
    this.router.navigate(['/manager/complex', id]);
  }

  handlePageChange(page: number) {
    this.page.set(page);
    this.getAllComplexes(this.page(), this.itemsPerPage());
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.getAllComplexes(this.page(), this.itemsPerPage());
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
      this.getAllComplexes(this.page(), this.itemsPerPage())
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
    this.getAllComplexes(this.page(), this.itemsPerPage(), this.search(), this.status());
  }

  updateStatus(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    console.log('selected:', value);
    this.status.set(value as 'all' | 'true' | 'false');

    this.page.set(1);

    this.getAllComplexes(this.page(), this.itemsPerPage(), '', this.status());
  }

  updateSortBy(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    console.log('selected:', value);
    this.sortBy.set(value);

    this.page.set(1);

    this.getAllComplexes(this.page(), this.itemsPerPage(), '', this.status(), this.sortBy());
  }

  handleStatus(complex: Complex): string {
    if (complex.openAt <= new Date().getTime().toString() && complex.closeAt >= new Date().getTime().toString()) {
      return 'Open';
    } else {
      return 'Closed';
    }
  }

  openDeleteModal(id: number) {
    this.complexIdToDelete.set(id);
    this.showDeleteModal.set(true);
  }

  // passed to modal
  cancelDelete = () => {
    this.showDeleteModal.set(false);
    this.complexIdToDelete.set(null);
  };

  confirmDelete = () => {
    const id = this.complexIdToDelete();
    if (id == null) return;

    this.complexService.deleteComplex(id).subscribe({
      next: () => {
        // remove from local list without full reload
        this.complexes.update((list) => list.filter((c) => c.id !== id));

        this.toastService.success('Complex deleted successfully.');
        this.showDeleteModal.set(false);
        this.complexIdToDelete.set(null);
        this.getComplexCount(); // keep pagination in sync if needed
      },
      error: () => {
        this.toastService.error('Failed to delete complex.');
      },
    });
  };

  goToBookings(id: number) {
this.router.navigate(['/manager/manager-booking', id]);}
}
