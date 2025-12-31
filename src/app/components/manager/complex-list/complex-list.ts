import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { Router, RouterLink } from '@angular/router';
import { Complex } from '../../../models/complex.model';
import { ComplexService } from '../../../services/complex.service';

@Component({
  selector: 'app-complex-list',
  imports: [ManagerLayout, RouterLink],
  templateUrl: './complex-list.html',
  styleUrl: './complex-list.css',
})
export class ComplexList implements OnInit {
  private complexService = inject(ComplexService);
  private router = inject(Router);

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

  editComplex(id: number) {
    this.router.navigate(['/manager/complex/edit', id]);
  }

  deleteComplex(id: number) {
    // model popup comfirmation
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
}
