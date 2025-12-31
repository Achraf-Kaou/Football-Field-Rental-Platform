// user-bookings-page.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button';
import { CardComponent } from '../../ui/card/card';
import { NavbarMain } from '../../common/navbar-main/navbar-main';
import { FooterMain } from '../../common/footer-main/footer-main';


interface Booking {
  id: string;
  fieldId: string;
  fieldName: string;
  date: string;
  time: string;
  duration: number;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface Review {
  id: string;
  fieldId: string;
  fieldName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Field {
  id: string;
  name: string;
  location: string;
  image: string;
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
export class UserBookings {
  activeTab = signal<'bookings' | 'reviews'>('bookings');

  // Mock data
  fields = signal<Field[]>([
    {
      id: '1',
      name: 'Elite Sports Arena',
      location: 'Downtown, City Center',
      image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80'
    },
    {
      id: '2',
      name: 'Green Valley Stadium',
      location: 'North District',
      image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80'
    },
    {
      id: '3',
      name: 'Sunset Sports Complex',
      location: 'West Side',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'
    }
  ]);

  userBookings = signal<Booking[]>([
    {
      id: 'b1',
      fieldId: '1',
      fieldName: 'Elite Sports Arena',
      date: '2024-12-25',
      time: '14:00',
      duration: 2,
      totalPrice: 100,
      status: 'confirmed'
    },
    {
      id: 'b2',
      fieldId: '2',
      fieldName: 'Green Valley Stadium',
      date: '2024-12-28',
      time: '16:00',
      duration: 1,
      totalPrice: 45,
      status: 'pending'
    },
    {
      id: 'b3',
      fieldId: '3',
      fieldName: 'Sunset Sports Complex',
      date: '2024-12-20',
      time: '18:00',
      duration: 2,
      totalPrice: 80,
      status: 'cancelled'
    }
  ]);

  userReviews = signal<Review[]>([
    {
      id: 'r1',
      fieldId: '1',
      fieldName: 'Elite Sports Arena',
      rating: 5,
      comment: 'Excellent facilities! The field was in perfect condition and the staff was very professional. Will definitely book again.',
      date: '2024-12-15'
    },
    {
      id: 'r2',
      fieldId: '2',
      fieldName: 'Green Valley Stadium',
      rating: 4,
      comment: 'Great experience overall. The only minor issue was parking, but the field quality was top-notch.',
      date: '2024-12-10'
    }
  ]);

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

  getFieldImage(fieldId: string): string {
    return this.fields().find(f => f.id === fieldId)?.image || '';
  }

  getFieldLocation(fieldId: string): string {
    return this.fields().find(f => f.id === fieldId)?.location || '';
  }

  viewDetails(bookingId: string) {
    console.log('View booking details:', bookingId);
    alert(`Viewing details for booking ${bookingId}`);
  }

  cancelBooking(bookingId: string) {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.userBookings.update(bookings =>
        bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b)
      );
      alert('Booking cancelled successfully');
    }
  }

  deleteBooking(bookingId: string) {
    if (confirm('Are you sure you want to delete this booking?')) {
      this.userBookings.update(bookings =>
        bookings.filter(b => b.id !== bookingId)
      );
      alert('Booking deleted successfully');
    }
  }

  editReview(reviewId: string) {
    console.log('Edit review:', reviewId);
    alert('Review editing would open a modal/form here');
  }

  deleteReview(reviewId: string) {
    if (confirm('Are you sure you want to delete this review?')) {
      this.userReviews.update(reviews =>
        reviews.filter(r => r.id !== reviewId)
      );
      alert('Review deleted successfully');
    }
  }

  goToFields() {
    console.log('Navigate to fields page');
    // In real app, use Router
  }
}