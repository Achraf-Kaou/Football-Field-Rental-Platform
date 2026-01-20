import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { Complex } from '../../../models/complex.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplexService } from '../../../services/complex.service';
import { FieldService } from '../../../services/field.service';
import { BookingService } from '../../../services/booking.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manager-booking',
  imports: [ManagerLayout, CommonModule, FormsModule],
  templateUrl: './manager-booking.html',
  styleUrl: './manager-booking.css',
})
export class ManagerBooking implements OnInit {
  private complexService = inject(ComplexService);
  private bookingService = inject(BookingService);
  private fieldService = inject(FieldService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  complex = signal<Complex | null>(null);
  fields = signal<any[]>([]);
  bookings = signal<any[]>([]);
  
  // Pagination
  page = signal<number>(1);
  itemsPerPage = signal<number>(10);
  totalItems = signal<number>(0);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage()));
  startIndex = computed(() => (this.page() - 1) * this.itemsPerPage() + 1);
  endIndex = computed(() => {
    const end = this.page() * this.itemsPerPage();
    return end > this.totalItems() ? this.totalItems() : end;
  });

  // Filters
  search = signal<string>('');
  selectedDate = signal<string>('');
  selectedField = signal<string>('all');
  selectedStatus = signal<string>('all');

  // Statistics
  todayBookingsCount = computed(() => {
    const today = new Date().toDateString();
    return this.bookings().filter(booking => {
      const bookingDate = new Date(booking.startAt).toDateString();
      return bookingDate === today;
    }).length;
  });

  activeFieldsCount = computed(() => {
    const activeFields = new Set(
      this.bookings()
        .filter(b => b.status === 'confirmed')
        .map(b => b.fieldId)
    );
    return activeFields.size;
  });

  totalRevenue = computed(() => {
    return this.bookings()
      .filter(b => b.status === 'confirmed')
      .reduce((sum, booking) => sum + (booking.price || 60), 0);
  });

  // Filtered bookings
  filteredBookings = computed(() => {
    let filtered = [...this.bookings()];

    // Search filter
    if (this.search()) {
      const searchLower = this.search().toLowerCase();
      filtered = filtered.filter(booking =>
        booking.userId?.toLowerCase().includes(searchLower) ||
        booking.id?.toString().includes(searchLower)
      );
    }

    // Date filter
    if (this.selectedDate()) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.startAt).toDateString();
        const selectedDate = new Date(this.selectedDate()).toDateString();
        return bookingDate === selectedDate;
      });
    }

    // Field filter
    if (this.selectedField() !== 'all') {
      filtered = filtered.filter(booking =>
        booking.fieldId?.toString() === this.selectedField()
      );
    }

    // Status filter
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(booking =>
        booking.status?.toLowerCase() === this.selectedStatus().toLowerCase()
      );
    }

    return filtered;
  });

  // Paginated bookings
  paginatedBookings = computed(() => {
    const start = (this.page() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredBookings().slice(start, end);
  });

  ngOnInit(): void {
    const complexId = Number(this.route.snapshot.paramMap.get('complexId'));
    if (complexId) {
      this.loadComplex(complexId);
      this.loadFields(complexId);
      this.loadAllBookings(complexId);
    }
  }

  loadComplex(complexId: number) {
    this.complexService.getComplexById(complexId).subscribe({
      next: (complex) => {
        this.complex.set(complex);
      },
      error: (err) => {
        console.error('Error loading complex:', err);
      }
    });
  }

  loadFields(complexId: number) {
    this.fieldService.getAllFields(undefined, undefined, undefined, undefined, undefined, complexId).subscribe({
      next: (fields) => {
        this.fields.set(fields);
      },
      error: (err) => {
        console.error('Error loading fields:', err);
      }
    });
  }

  loadAllBookings(complexId: number) {
    this.bookingService.getBookingsByComplexId(complexId).subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.totalItems.set(bookings.length);
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
      }
    });
  }

  // Filter handlers
  updateSearch(value: string) {
    this.search.set(value);
    this.page.set(1);
    this.totalItems.set(this.filteredBookings().length);
  }

  updateDate(value: string) {
    this.selectedDate.set(value);
    this.page.set(1);
    this.totalItems.set(this.filteredBookings().length);
  }

  updateFieldFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedField.set(value);
    this.page.set(1);
    this.totalItems.set(this.filteredBookings().length);
  }

  updateStatusFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(value);
    this.page.set(1);
    this.totalItems.set(this.filteredBookings().length);
  }

  // Pagination handlers
  handlePageChange(page: number) {
    this.page.set(page);
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
    }
  }

  generateRange(start: number, end: number): number[] {
    const list = [];
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }

  // Utility methods
  getFieldName(fieldId: number): string {
    const field = this.fields().find(f => f.id === fieldId);
    return field ? field.name : 'Unknown Field';
  }

  getFieldType(fieldId: number): string {
    const field = this.fields().find(f => f.id === fieldId);
    return field ? field.type : 'Unknown';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-primary/20 text-primary border-primary/20';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/20 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
    }
  }

  getStatusDotClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-primary';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  // Actions
  viewBookingDetails(bookingId: number) {
    // Navigate to booking details
    console.log('View booking:', bookingId);
  }

  exportBookings() {
    // Export functionality
    console.log('Exporting bookings...');
  }
}