// ============================================
// review.model.ts
// Complete Review Model with all interfaces
// ============================================

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  userId: number;
  fieldId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  user?: ReviewUser;
  field?: ReviewField;
}

export interface ReviewUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ReviewField {
  id: number;
  name: string;
  type: string;
  complex: ReviewComplex;
}

export interface ReviewComplex {
  id: number;
  name: string;
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
  ratingDistribution: RatingDistribution;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
}

// ============================================
// DTOs for API requests
// ============================================

export interface CreateReviewDto {
  fieldId: number;
  rating: number;
  comment?: string;
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
// Helper types and enums
// ============================================

export type StarType = 'full' | 'half' | 'empty';

export enum ReviewRating {
  OneStar = 1,
  TwoStars = 2,
  ThreeStars = 3,
  FourStars = 4,
  FiveStars = 5,
}

export enum ReviewQuality {
  VeryPoor = 'Very Poor',
  Poor = 'Poor',
  Average = 'Average',
  Good = 'Good',
  Excellent = 'Excellent',
}

// ============================================
// Utility classes
// ============================================

export class ReviewHelpers {
  /**
   * Format a rating to 1 decimal place
   */
  static formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  /**
   * Get star icons array based on rating
   */
  static getStarIcons(rating: number): StarType[] {
    const stars: StarType[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }

    if (hasHalfStar && stars.length < 5) {
      stars.push('half');
    }

    while (stars.length < 5) {
      stars.push('empty');
    }

    return stars;
  }

  /**
   * Get rating quality text
   */
  static getRatingQuality(rating: number): ReviewQuality {
    if (rating >= 4.5) return ReviewQuality.Excellent;
    if (rating >= 3.5) return ReviewQuality.Good;
    if (rating >= 2.5) return ReviewQuality.Average;
    if (rating >= 1.5) return ReviewQuality.Poor;
    return ReviewQuality.VeryPoor;
  }

  /**
   * Get CSS color class for rating
   */
  static getRatingColorClass(rating: number): string {
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    if (rating >= 2.5) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  /**
   * Get background color class for rating
   */
  static getRatingBgClass(rating: number): string {
    if (rating >= 4.5) return 'bg-green-100 dark:bg-green-900/30';
    if (rating >= 3.5) return 'bg-yellow-100 dark:bg-yellow-900/30';
    if (rating >= 2.5) return 'bg-orange-100 dark:bg-orange-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  }

  /**
   * Calculate percentage for a specific rating
   */
  static getRatingPercentage(
    distribution: RatingDistribution,
    rating: number,
    total: number
  ): number {
    if (total === 0) return 0;
    const count = distribution[rating as keyof RatingDistribution];
    return (count / total) * 100;
  }

  /**
   * Get user's full name from review
   */
  static getUserFullName(review: Review): string {
    if (!review.user) return 'Anonymous';
    return `${review.user.firstName} ${review.user.lastName}`;
  }

  /**
   * Get user's initials from review
   */
  static getUserInitials(review: Review): string {
    if (!review.user) return 'A';
    const firstInitial = review.user.firstName?.charAt(0) || '';
    const lastInitial = review.user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get relative time (e.g., "2 days ago")
   */
  static getRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /**
   * Validate rating value
   */
  static isValidRating(rating: number): boolean {
    return rating >= 1 && rating <= 5 && Number.isInteger(rating);
  }

  /**
   * Validate comment length (optional max length check)
   */
  static isValidComment(comment: string, maxLength = 1000): boolean {
    return comment.length <= maxLength;
  }

  /**
   * Check if review is recent (within last 7 days)
   */
  static isRecentReview(review: Review): boolean {
    const createdAt =
      typeof review.createdAt === 'string' ? new Date(review.createdAt) : review.createdAt;
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days <= 7;
  }

  /**
   * Sort reviews by date (newest first)
   */
  static sortByNewest(reviews: Review[]): Review[] {
    return [...reviews].sort((a, b) => {
      const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
      const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Sort reviews by rating (highest first)
   */
  static sortByRating(reviews: Review[]): Review[] {
    return [...reviews].sort((a, b) => b.rating - a.rating);
  }

  /**
   * Filter reviews by minimum rating
   */
  static filterByMinRating(reviews: Review[], minRating: number): Review[] {
    return reviews.filter((review) => review.rating >= minRating);
  }

  /**
   * Filter reviews with comments only
   */
  static filterWithComments(reviews: Review[]): Review[] {
    return reviews.filter((review) => review.comment && review.comment.trim().length > 0);
  }

  /**
   * Calculate average rating from reviews array
   */
  static calculateAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }

  /**
   * Get rating distribution from reviews array
   */
  static getRatingDistribution(reviews: Review[]): RatingDistribution {
    return reviews.reduce(
      (dist, review) => {
        dist[review.rating as keyof RatingDistribution]++;
        return dist;
      },
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingDistribution
    );
  }
}

// ============================================
// Type guards
// ============================================

export function isReview(obj: any): obj is Review {
  return (
    obj &&
    typeof obj === 'object' &&
    'id' in obj &&
    'rating' in obj &&
    'userId' in obj &&
    'fieldId' in obj
  );
}

export function isPaginatedReviews(obj: any): obj is PaginatedReviews {
  return (
    obj &&
    typeof obj === 'object' &&
    'data' in obj &&
    Array.isArray(obj.data) &&
    'total' in obj &&
    'page' in obj &&
    'limit' in obj &&
    'totalPages' in obj
  );
}

export function isAverageRating(obj: any): obj is AverageRating {
  return (
    obj &&
    typeof obj === 'object' &&
    'fieldId' in obj &&
    'averageRating' in obj &&
    'totalReviews' in obj &&
    'ratingDistribution' in obj
  );
}