import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { FieldModel } from '../models/field.model';
import { User } from '../models/user.model';

// ============================================
// Interfaces & DTOs
// ============================================

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  userId: number;
  fieldId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  user?: User;
  field?: FieldModel;
}

export interface PaginatedReviews {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AverageRating {
  fieldId: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
}

export interface CreateReviewDto {
  fieldId: number;
  rating: number;
  comment?: string;
  userId?: number;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface ReviewFilters {
  page?: number;
  limit?: number;
  fieldId?: number;
  userId?: number;
  minRating?: number;
  maxRating?: number;
}

// ============================================
// Service
// ============================================

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reviews`;

  /**
   * Create a new review for a field
   * @param data - Review data (fieldId, rating, optional comment)
   * @returns Observable<Review>
   */
  createReview(data: CreateReviewDto): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, data);
  }

  /**
   * Convenience method to create a review
   */
  createReviewSimple(fieldId: number, rating: number, comment?: string): Observable<Review> {
    return this.createReview({ fieldId, rating, comment });
  }

  /**
   * Get all reviews with optional filters and pagination
   * @param filters - Optional filters (page, limit, fieldId, userId, minRating, maxRating)
   * @returns Observable<PaginatedReviews>
   */
  getReviews(filters?: ReviewFilters): Observable<PaginatedReviews> {
    let params = new HttpParams();

    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    if (filters?.fieldId) params = params.set('fieldId', filters.fieldId.toString());
    if (filters?.userId) params = params.set('userId', filters.userId.toString());
    if (filters?.minRating) params = params.set('minRating', filters.minRating.toString());
    if (filters?.maxRating) params = params.set('maxRating', filters.maxRating.toString());

    return this.http.get<PaginatedReviews>(this.apiUrl, { params });
  }

  /**
   * Get reviews for a specific field
   * @param fieldId - ID of the field
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Observable<PaginatedReviews>
   */
  getFieldReviews(fieldId: number, page = 1, limit = 10): Observable<PaginatedReviews> {
    return this.getReviews({ fieldId, page, limit });
  }

  /**
   * Get reviews by a specific user
   * @param userId - ID of the user
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Observable<PaginatedReviews>
   */
  getUserReviews(userId: number, page = 1, limit = 10): Observable<PaginatedReviews> {
    return this.getReviews({ userId, page, limit });
  }

  /**
   * Get high-rated reviews (4 or 5 stars)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Observable<PaginatedReviews>
   */
  getHighRatedReviews(page = 1, limit = 10): Observable<PaginatedReviews> {
    return this.getReviews({ minRating: 4, page, limit });
  }

  /**
   * Get low-rated reviews (1 or 2 stars)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Observable<PaginatedReviews>
   */
  getLowRatedReviews(page = 1, limit = 10): Observable<PaginatedReviews> {
    return this.getReviews({ maxRating: 2, page, limit });
  }

  /**
   * Get a single review by ID
   * @param id - Review ID
   * @returns Observable<Review>
   */
  getReview(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get average rating and distribution for a field
   * @param fieldId - ID of the field
   * @returns Observable<AverageRating>
   */
  getFieldAverageRating(fieldId: number): Observable<AverageRating> {
    return this.http.get<AverageRating>(`${this.apiUrl}/field/${fieldId}/average`);
  }

  /**
   * Check if the current user can review a field
   * @param fieldId - ID of the field
   * @returns Observable<CanReviewResponse>
   */
  canReviewField(fieldId: number): Observable<CanReviewResponse> {
    return this.http.get<CanReviewResponse>(`${this.apiUrl}/can-review/${fieldId}`);
  }

  /**
   * Update a review
   * @param reviewId - ID of the review to update
   * @param data - Update data (rating and/or comment)
   * @returns Observable<Review>
   */
  updateReview(reviewId: number, data: UpdateReviewDto): Observable<Review> {
    return this.http.patch<Review>(`${this.apiUrl}/${reviewId}`, data);
  }

  /**
   * Convenience method to update a review
   */
  updateReviewSimple(reviewId: number, rating?: number, comment?: string): Observable<Review> {
    const data: UpdateReviewDto = {};
    if (rating !== undefined) data.rating = rating;
    if (comment !== undefined) data.comment = comment;
    return this.updateReview(reviewId, data);
  }

  /**
   * Delete a review (soft delete)
   * @param reviewId - ID of the review to delete
   * @returns Observable<void>
   */
  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reviewId}`);
  }

  /**
   * Get the count of reviews for a field
   * @param fieldId - ID of the field
   * @returns Observable<number>
   */
  getFieldReviewCount(fieldId: number): Observable<number> {
    return new Observable((observer) => {
      this.getFieldReviews(fieldId, 1, 1).subscribe({
        next: (result) => {
          observer.next(result.total);
          observer.complete();
        },
        error: (error) => observer.error(error),
      });
    });
  }

  /**
   * Check if a field has reviews
   * @param fieldId - ID of the field
   * @returns Observable<boolean>
   */
  hasReviews(fieldId: number): Observable<boolean> {
    return new Observable((observer) => {
      this.getFieldReviewCount(fieldId).subscribe({
        next: (count) => {
          observer.next(count > 0);
          observer.complete();
        },
        error: (error) => observer.error(error),
      });
    });
  }

  /**
   * Get the percentage of 5-star reviews for a field
   * @param fieldId - ID of the field
   * @returns Observable<number>
   */
  getFiveStarPercentage(fieldId: number): Observable<number> {
    return new Observable((observer) => {
      this.getFieldAverageRating(fieldId).subscribe({
        next: (result) => {
          if (result.totalReviews === 0) {
            observer.next(0);
          } else {
            const percentage = (result.ratingDistribution[5] / result.totalReviews) * 100;
            observer.next(Math.round(percentage * 10) / 10);
          }
          observer.complete();
        },
        error: (error) => observer.error(error),
      });
    });
  }

  /**
   * Helper method to format rating display
   * @param rating - Rating value
   * @returns Formatted string (e.g., "4.5")
   */
  formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  /**
   * Helper method to get star icons based on rating
   * @param rating - Rating value
   * @returns Array of star types ['full', 'half', 'empty']
   */
  getStarIcons(rating: number): ('full' | 'half' | 'empty')[] {
    const stars: ('full' | 'half' | 'empty')[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }

    // Add half star if applicable
    if (hasHalfStar && stars.length < 5) {
      stars.push('half');
    }

    // Fill remaining with empty stars
    while (stars.length < 5) {
      stars.push('empty');
    }

    return stars;
  }

  /**
   * Helper method to get rating color class
   * @param rating - Rating value
   * @returns CSS class name
   */
  getRatingColorClass(rating: number): string {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Helper method to get rating text
   * @param rating - Rating value
   * @returns Rating text (e.g., "Excellent", "Good")
   */
  getRatingText(rating: number): string {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Average';
    if (rating >= 1.5) return 'Poor';
    return 'Very Poor';
  }
}