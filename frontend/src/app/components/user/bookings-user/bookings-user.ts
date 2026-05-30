// user-bookings-page.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ReviewService, Review, CreateReviewDto, UpdateReviewDto } from '../../../services/review.service';
import { forkJoin } from 'rxjs';

interface BookingWithReviewStatus extends Booking {
  hasReview?: boolean;
  userReview?: Review;
  canReview?: boolean;
}

interface ReviewFormData {
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-user-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, CardComponent, NavbarMain, FooterMain],
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

    .star-rating {
      display: inline-flex;
      gap: 0.25rem;
    }

    .star-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: transform 0.2s;
    }

    .star-button:hover {
      transform: scale(1.2);
    }

    .star-button:focus {
      outline: none;
    }
  `]
})
export class UserBookings implements OnInit {
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private reviewService = inject(ReviewService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  activeTab = signal<'bookings' | 'reviews'>('bookings');

  // Data signals
  fields = signal<FieldModel[]>([]);
  userBookings = signal<BookingWithReviewStatus[]>([]);
  userReviews = signal<Review[]>([]);
  user = signal<User | null>(null);

  // Review modal state
  showReviewModal = signal<boolean>(false);
  currentBookingForReview = signal<BookingWithReviewStatus | null>(null);
  isEditingReview = signal<boolean>(false);
  reviewFormData = signal<ReviewFormData>({ rating: 5, comment: '' });

  // Edit review modal state
  showEditReviewModal = signal<boolean>(false);
  currentReviewForEdit = signal<Review | null>(null);
  editReviewFormData = signal<ReviewFormData>({ rating: 5, comment: '' });

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    this.user.set(currentUser);
    
    if (currentUser) {
      this.loadUserBookings(currentUser);
      this.loadUserReviews(currentUser.id);
    }
  }

  loadUserBookings(user: User) {
    this.bookingService.getBookingsByUserId(user.id).subscribe({
      next: (bookings: Booking[]) => {
        // Check review status for each booking
        const bookingsWithStatus: BookingWithReviewStatus[] = bookings.map(booking => ({
          ...booking,
          hasReview: false,
          canReview: false
        }));

        // Check which bookings have reviews and can be reviewed
        const reviewChecks = bookingsWithStatus.map(booking => 
          this.reviewService.canReviewField(booking.field.id)
        );

        forkJoin(reviewChecks).subscribe({
          next: (canReviewResults) => {
            bookingsWithStatus.forEach((booking, index) => {
              booking.canReview = canReviewResults[index].canReview;
            });
            
            // Load existing reviews
            this.reviewService.getUserReviews(user.id).subscribe({
              next: (reviewsData) => {
                const userFieldReviews = reviewsData.data;
                bookingsWithStatus.forEach(booking => {
                  const existingReview = userFieldReviews.find(
                    r => r.fieldId === booking.field.id
                  );
                  if (existingReview) {
                    booking.hasReview = true;
                    booking.userReview = existingReview;
                  }
                });
                
                this.userBookings.set(bookingsWithStatus);
              },
              error: (err) => {
                console.error('Error loading user reviews:', err);
                this.userBookings.set(bookingsWithStatus);
              }
            });
          },
          error: (err) => {
            console.error('Error checking review permissions:', err);
            this.userBookings.set(bookingsWithStatus);
          }
        });
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.toastService.error('Failed to load bookings', 3000);
      }
    });
  }

  loadUserReviews(userId: number) {
    this.reviewService.getUserReviews(userId).subscribe({
      next: (data) => {
        this.userReviews.set(data.data);
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.toastService.error('Failed to load reviews', 3000);
      }
    });
  }

  // Review Modal Methods
  openReviewModal(booking: BookingWithReviewStatus) {
    if (booking.hasReview && booking.userReview) {
      // If review exists, open edit mode
      this.currentReviewForEdit.set(booking.userReview);
      this.editReviewFormData.set({
        rating: booking.userReview.rating,
        comment: booking.userReview.comment || ''
      });
      this.showEditReviewModal.set(true);
    } else {
      // Create new review
      this.currentBookingForReview.set(booking);
      this.reviewFormData.set({ rating: 5, comment: '' });
      this.isEditingReview.set(false);
      this.showReviewModal.set(true);
    }
  }

  closeReviewModal() {
    this.showReviewModal.set(false);
    this.currentBookingForReview.set(null);
    this.reviewFormData.set({ rating: 5, comment: '' });
  }

  setRating(rating: number) {
    this.reviewFormData.update(data => ({ ...data, rating }));
  }

  submitReview() {
    const booking = this.currentBookingForReview();
    const formData = this.reviewFormData();
    
    if (!booking || !this.user()) {
      return;
    }

    const reviewDto: CreateReviewDto = {
      fieldId: booking.field.id,
      rating: formData.rating,
      comment: formData.comment || undefined,
      userId: this.user()!.id
    };
    console.log('Submitting review:', reviewDto);
    this.reviewService.createReview(reviewDto).subscribe({
      next: (review) => {
        this.toastService.success('Review submitted successfully!', 3000);
        this.closeReviewModal();
        
        // Update booking status
        this.userBookings.update(bookings =>
          bookings.map(b =>
            b.id === booking.id
              ? { ...b, hasReview: true, userReview: review }
              : b
          )
        );
        
        // Reload reviews
        if (this.user()) {
          this.loadUserReviews(this.user()!.id);
        }
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.toastService.error('Failed to submit review. Please try again.', 3000);
      }
    });
  }

  // Edit Review Modal Methods
  openEditReviewModal(review: Review) {
    this.currentReviewForEdit.set(review);
    this.editReviewFormData.set({
      rating: review.rating,
      comment: review.comment || ''
    });
    this.showEditReviewModal.set(true);
  }

  closeEditReviewModal() {
    this.showEditReviewModal.set(false);
    this.currentReviewForEdit.set(null);
    this.editReviewFormData.set({ rating: 5, comment: '' });
  }

  setEditRating(rating: number) {
    this.editReviewFormData.update(data => ({ ...data, rating }));
  }

  submitEditReview() {
    const review = this.currentReviewForEdit();
    const formData = this.editReviewFormData();
    
    if (!review) {
      return;
    }

    const updateDto: UpdateReviewDto = {
      rating: formData.rating,
      comment: formData.comment || undefined
    };

    this.reviewService.updateReview(review.id, updateDto).subscribe({
      next: (updatedReview) => {
        this.toastService.success('Review updated successfully!', 3000);
        this.closeEditReviewModal();
        
        // Update reviews list
        this.userReviews.update(reviews =>
          reviews.map(r => r.id === review.id ? updatedReview : r)
        );
        
        // Update bookings list
        this.userBookings.update(bookings =>
          bookings.map(b =>
            b.userReview?.id === review.id
              ? { ...b, userReview: updatedReview }
              : b
          )
        );
      },
      error: (err) => {
        console.error('Error updating review:', err);
        this.toastService.error('Failed to update review. Please try again.', 3000);
      }
    });
  }

  deleteReview(reviewId: number) {
    if (confirm('Are you sure you want to delete this review?')) {
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          this.toastService.success('Review deleted successfully', 3000);
          
          // Update reviews list
          this.userReviews.update(reviews =>
            reviews.filter(r => r.id !== reviewId)
          );
          
          // Update bookings list
          this.userBookings.update(bookings =>
            bookings.map(b =>
              b.userReview?.id === reviewId
                ? { ...b, hasReview: false, userReview: undefined }
                : b
            )
          );
        },
        error: (err) => {
          console.error('Error deleting review:', err);
          this.toastService.error('Failed to delete review. Please try again.', 3000);
        }
      });
    }
  }

  // Helper methods
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
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return booking.field.price * hours;
  }

  calculateDuration(booking: Booking): number {
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
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

  goToFields() {
    this.router.navigate(['/user/fields']);
  }

  // Star rating helpers
  getStarArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  getStarIcon(position: number, rating: number): string {
    return position <= rating ? 'star' : 'star_border';
  }

  getStarColor(position: number, rating: number): string {
    return position <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600';
  }

  formatReviewDate(date: Date | string): string {
    const reviewDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}