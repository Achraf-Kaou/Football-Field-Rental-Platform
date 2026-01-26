// user-bookings-page.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button';
import { CardComponent } from '../../ui/card/card';
import { NavbarMain } from '../../common/navbar-main/navbar-main';
import { FooterMain } from '../../common/footer-main/footer-main';
import { BookingService } from '../../../services/booking.service';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { Booking } from '../../../models/booking.model'
import { FieldModel } from '../../../models/field.model';
import { ToastService } from '../../../services/toast.service';

interface Review {
  id: string;
  fieldId: string;
  fieldName: string;
  rating: number;
  comment: string;
  date: string;
}

@Component({
  selector: 'app-user-bookings',
  standalone: true,
  imports: [CommonModule, ButtonComponent, CardComponent, NavbarMain, FooterMain],
  templateUrl: './bookings-user.html',
  styles: [`
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fade-in 0.3s ease-out;
    }
  `]
})
export class UserBookings implements OnInit {
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  activeTab = signal<'bookings' | 'reviews'>('bookings');

  // Mock data
  fields = signal<FieldModel[]>([]);

  userBookings = signal<Booking[]>([]);

  userReviews = signal<Review[]>([]);

  user = signal<User | null>(null);

  ngOnInit(): void {
    this.user.set(this.authService.currentUser());
    this.loadUserBookings(this.user());
  }

  loadUserBookings(user: User | null) {
    this.bookingService.getBookingsByUserId(user?.id).subscribe({
      next: (data: Booking[]) => {
        this.userBookings.set(data);
        console.log(data);
      },
      error(err) {
        console.log(err)
      },
    })
  }

  getTabClass(tab: 'bookings' | 'reviews'): string {
    const active = 'bg-white dark:bg-surface-card text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-white/10';
    const inactive = 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
    return this.activeTab() === tab ? active : inactive;
  }

  getStatusBadgeClass(status: string): string {
    const base = 'inline-flex items-center';
    switch (status) {
      case 'confirmed':
        return `${base} bg-primary/10 text-primary border border-primary/20`;
      case 'pending':
        return `${base} bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20`;
      case 'cancelled':
        return `${base} bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20`;
      default:
        return `${base} bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20`;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  viewDetails(bookingId: string) {
    console.log('View booking details:', bookingId);
    alert(`Viewing details for booking ${bookingId}`);
  }

  calculateTotal(booking: Booking): number {
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);

    // Calculate difference in hours
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return booking.field.price * hours;
  }

  calculateDuration(booking: Booking): number {
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
    // Calculate difference in hours
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  cancelBooking(bookingId: number) {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.updateBooking(bookingId, { status: 'cancelled' }).subscribe({
        next: () => {
          this.userBookings.update(bookings =>
            bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b)
          );
          this.toastService.success('Booking cancelled successfully', 3000);
        },
        error: (err) => {
          console.error('Error cancelling booking:', err);
          this.toastService.error('Failed to cancel booking. Please try again.', 3000);
        }
      });
    }
  }

  deleteBooking(bookingId: number) {
    if (confirm('Are you sure you want to delete this booking?')) {
      this.bookingService.deleteBooking(bookingId).subscribe({
        next: () => {
          this.userBookings.update(bookings =>
            bookings.filter(b => b.id !== bookingId)
          );
          this.toastService.success('Booking deleted successfully', 3000);
        },
        error: (err) => {
          console.error('Error deleting booking:', err);
          this.toastService.error('Failed to delete booking. Please try again.', 3000);
        }
      });
    }
  }

  editReview(reviewId: string) {
    console.log('Edit review:', reviewId);
    this.toastService.info('Review editing feature coming soon', 3000);
  }

  deleteReview(reviewId: string) {
    if (confirm('Are you sure you want to delete this review?')) {
      this.userReviews.update(reviews =>
        reviews.filter(r => r.id !== reviewId)
      );
      this.toastService.success('Review deleted successfully', 3000);
    }
  }

  goToFields() {
    this.router.navigate(['/user/fields']);
  }
}