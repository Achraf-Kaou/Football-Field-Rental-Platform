import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Complex } from '../../../models/complex.model';
import { ComplexService } from '../../../services/complex.service';
import { DeleteModal } from '../../ui/delete-modal/delete-modal';
import { ToastService } from '../../../services/toast.service';
import { filter } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

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
  private authService = inject(AuthService);


  complexes = signal<Complex[]>([]);
  page = signal<number>(1);
  itemsPerPage = signal<number>(10);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);
  startIndex = computed(() => (this.page() * this.itemsPerPage() - 9));
  endIndex = computed(() => { if (this.page() === this.totalPages()) return this.totalItems(); else return (this.page() * this.itemsPerPage()) });
  user=this.authService.currentUser;
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

  getComplexCount(userId?:number) {
    this.complexService.getComplexCount(userId).subscribe((data) => {
      this.totalItems.set(data);
      this.totalPages.set(Math.ceil(data / this.itemsPerPage()));
    });
  }

  getAllComplexes(page?: number, itemsPerPage?: number, search?: string, status?: string, userId?: number, sortBy?: string) {
    this.complexService.getAllComplexes(page, itemsPerPage, search, status, userId, sortBy).subscribe((data) => {
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
    console.log('selected:', value);
    this.status.set(value as 'all' | 'true' | 'false');

    this.page.set(1);

    this.getAllComplexes(this.page(), this.itemsPerPage(), '', this.status(), this.user()?.id);
  }

  updateSortBy(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    console.log('selected:', value);
    this.sortBy.set(value);

    this.page.set(1);

    this.getAllComplexes(this.page(), this.itemsPerPage(), '', this.status(), this.user()?.id);
  }

  handleStatus(complex: Complex): string {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Parse opening time (format: "HH:MM")
    const [openHour, openMin] = complex.openAt.split(':').map(Number);
    const openTimeInMinutes = openHour * 60 + openMin;

    // Parse closing time (format: "HH:MM")
    const [closeHour, closeMin] = complex.closeAt.split(':').map(Number);
    const closeTimeInMinutes = closeHour * 60 + closeMin;

    // Check if current time is within operating hours
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
    this.router.navigate(['/manager/manager-booking', id]);
  }
}
