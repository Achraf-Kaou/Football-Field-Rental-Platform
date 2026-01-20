import { Component, computed, DestroyRef, inject, OnChanges, OnInit, signal, SimpleChanges } from '@angular/core';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { Complex } from '../../../models/complex.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplexService } from '../../../services/complex.service';
import { FieldService } from '../../../services/field.service';
import { ToastService } from '../../../services/toast.service';
import { FieldModel } from '../../../models/field.model';
import { DeleteModal } from '../../ui/delete-modal/delete-modal';

@Component({
  selector: 'app-complex-overview',
  imports: [ManagerLayout, DeleteModal],
  templateUrl: './complex-overview.html',
  styleUrl: './complex-overview.css',
})
export class ComplexOverview implements OnInit, OnChanges{
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private complexService = inject(ComplexService);
  private fieldService = inject(FieldService);
  private toastService = inject(ToastService);

  complex = signal<Complex | null>(null);
  complexId = signal<number | null>(null);
  fieldsCount = signal<number>(0);
  fields = signal<FieldModel[]>([]);  

  page = signal<number>(1);
  itemsPerPage = signal<number>(10);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);
  startIndex = computed(() => (this.page() * this.itemsPerPage() - 9));
  endIndex = computed(() => { if (this.page() === this.totalPages()) return this.totalItems(); else return (this.page() * this.itemsPerPage()) });

  search = signal<string>('')
  sortedBy = signal<string>('')
  sortedDirection = signal<'asc' | 'desc'>('desc')
  status = signal<string>('')
  type = signal<string>('')

  showDeleteModal = signal<boolean>(false);
  fieldIdToDelete = signal<number | null>(null);

  ngOnInit(): void {
    const complexId = this.route.snapshot.paramMap.get('id');
    if (complexId) {
      this.complexId.set(+complexId);
      this.getComplexById(this.complexId());
      this.countComplexFields(this.complexId());
      this.getFieldsByComplexId(this.page(), this.itemsPerPage(), this.search(), this.sortedBy(), this.sortedDirection(), this.complexId(), this.status(), this.type());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.ngOnInit();
  }

  getComplexById(id: number | null) {
    if (id === null) {this.toastService.error('complex wit this id not found', 3000);return;}
    this.complexService.getComplexById(id).subscribe((data) => {
      this.complex.set(data);
    });
  }

  countComplexFields(id?: number | null) {
    if (id) 
      return this.fieldService.countAll(id).subscribe((data) => {
        this.totalItems.set(data);
        this.totalPages.set(Math.ceil(data / this.itemsPerPage()));
        console.log(data);
      });
    return this.fieldService.countAll().subscribe((data) => {
      this.totalItems.set(data);
      this.totalPages.set(Math.ceil(data / this.itemsPerPage()));
    });
  }

  getFieldsByComplexId(page?:number, limit?: number,search?: string, sortedBy?: string, sortedDirection?: string, complexId?: number| null, status?: string, type?: string) {
    console.log(page, limit, search, sortedBy, sortedDirection, complexId, status, type)
    if (complexId === null) {this.toastService.error('complex wit this id not found', 3000);return;}
    this.fieldService.getAllFields(page, limit, search, sortedBy, undefined, complexId, status, type).subscribe({
      next : (data) => {
        this.fields.set(data);
      },
      error : (err) => {
        this.toastService.error('Error fetching fields: ' + err.message, 3000);
      }
    });
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
        // remove from local list without full reload
        this.fields.update((list) => list.filter((f) => f.id !== id));

        this.toastService.success('Complex deleted successfully.');
        this.showDeleteModal.set(false);
        this.fieldIdToDelete.set(null);
        this.countComplexFields(); // keep pagination in sync if needed
      },
      error: () => {
        this.toastService.error('Failed to delete complex.');
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
        console.log('available');
        return 'bg-green text-green-800';
      case 'closed':
        console.log('closed');
        return 'bg-red text-red-800';
      case 'maintenance':
        console.log('maintenance');
        return 'bg-orange text-orange-800';
      default:
        console.log('default');
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

  updateType(event: Event){
    const value = (event.target as HTMLInputElement).value;
    this.type.set(value as '' | '5' | '6' | '7' |'11');
    this.page.set(1);
    this.getFieldsByComplexId(this.page(), this.itemsPerPage(), this.search(), this.sortedBy(), this.sortedDirection(), this.complexId(), this.status(), this.type());
  }
}
