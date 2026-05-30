import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a new review for a field
     * - User must have a completed booking for this field
     * - User can only review a field once
     */
    async create(createReviewDto: CreateReviewDto): Promise<Review> {
        const { fieldId, rating, comment, userId } = createReviewDto;

        // Check if field exists
        const field = await this.prisma.field.findUnique({
            where: { id: fieldId },
        });

        if (!field) {
            throw new NotFoundException(`Field with ID ${fieldId} not found`);
        }

        // Check if user has a completed booking for this field
        const hasBooking = await this.prisma.booking.findFirst({
            where: {
                userId,
                fieldId,
                status: 'completed',
                deletedAt: null,
            },
        });

        if (!hasBooking) {
            throw new BadRequestException(
                'You must have a completed booking for this field before leaving a review',
            );
        }

        // Check if user already reviewed this field
        const existingReview = await this.prisma.review.findUnique({
            where: {
                userId_fieldId: {
                    userId,
                    fieldId,
                },
            },
        });

        if (existingReview && !existingReview.deletedAt) {
            throw new ConflictException('You have already reviewed this field');
        }

        // If there's a soft-deleted review, restore and update it
        if (existingReview && existingReview.deletedAt) {
            return this.prisma.review.update({
                where: { id: existingReview.id },
                data: {
                    rating,
                    comment,
                    deletedAt: null,
                    updatedAt: new Date(),
                },
                include: {
                    user: true,
                    field: true,
                },
            });
        }

        // Create new review
        return this.prisma.review.create({
            data: {
                userId,
                fieldId,
                rating,
                comment,
            },
            include: {
                user: true,
                field: true,
            },
        });
    }

    /**
     * Get all reviews with optional filters and pagination
     */
    async findAll(params: {
        page?: number;
        limit?: number;
        fieldId?: number;
        userId?: number;
        minRating?: number;
        maxRating?: number;
    }): Promise<{
        data: Review[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const { page = 1, limit = 10, fieldId, userId, minRating, maxRating } = params;
        const skip = (page - 1) * limit;

        const where: any = {
            deletedAt: null,
        };

        if (fieldId) where.fieldId = fieldId;
        if (userId) where.userId = userId;
        if (minRating || maxRating) {
            where.rating = {};
            if (minRating) where.rating.gte = minRating;
            if (maxRating) where.rating.lte = maxRating;
        }

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: true,
                    field: true,
                },
            }),
            this.prisma.review.count({ where }),
        ]);

        return {
            data: reviews,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get a single review by ID
     */
    async findOne(id: number): Promise<Review> {
        const review = await this.prisma.review.findUnique({
            where: { id },
            include: {
                user: true,
                field: true,
            },
        });

        if (!review || review.deletedAt) {
            throw new NotFoundException(`Review with ID ${id} not found`);
        }

        return review;
    }

    /**
     * Get average rating for a field
     */
    async getFieldAverageRating(fieldId: number): Promise<{
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
    }> {
        const reviews = await this.prisma.review.findMany({
            where: {
                fieldId,
                deletedAt: null,
            },
            select: {
                rating: true,
            },
        });

        if (reviews.length === 0) {
            return {
                fieldId,
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        const ratingDistribution = reviews.reduce(
            (dist, review) => {
                dist[review.rating]++;
                return dist;
            },
            { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        );

        return {
            fieldId,
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            totalReviews: reviews.length,
            ratingDistribution,
        };
    }

    /**
     * Update a review
     * - User can only update their own review
     */
    async update(
        id: number,
        userId: number,
        updateReviewDto: UpdateReviewDto,
    ): Promise<Review> {
        const review = await this.prisma.review.findUnique({
            where: { id },
        });

        if (!review || review.deletedAt) {
            throw new NotFoundException(`Review with ID ${id} not found`);
        }

        if (review.userId !== userId) {
            throw new ForbiddenException('You can only update your own reviews');
        }

        return this.prisma.review.update({
            where: { id },
            data: updateReviewDto,
            include: {
                user: true,
                field: true,
            },
        });
    }

    /**
     * Soft delete a review
     * - User can only delete their own review
     * - Admin can delete any review
     */
    async remove(id: number, userId: number, userRole: string): Promise<void> {
        const review = await this.prisma.review.findUnique({
            where: { id },
        });

        if (!review || review.deletedAt) {
            throw new NotFoundException(`Review with ID ${id} not found`);
        }

        if (review.userId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException('You can only delete your own reviews');
        }

        await this.prisma.review.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * Check if user can review a field
     */
    async canUserReviewField(userId: number, fieldId: number): Promise<{
        canReview: boolean;
        reason?: string;
    }> {
        // Check if field exists
        const field = await this.prisma.field.findUnique({
            where: { id: fieldId },
        });

        if (!field) {
            return {
                canReview: false,
                reason: 'Field not found',
            };
        }

        // Check if user already reviewed this field
        const existingReview = await this.prisma.review.findUnique({
            where: {
                userId_fieldId: {
                    userId,
                    fieldId,
                },
            },
        });

        if (existingReview && !existingReview.deletedAt) {
            return {
                canReview: false,
                reason: 'You have already reviewed this field',
            };
        }

        // Check if user has a completed booking for this field
        const hasBooking = await this.prisma.booking.findFirst({
            where: {
                userId,
                fieldId,
                status: 'completed',
                deletedAt: null,
            },
        });

        if (!hasBooking) {
            return {
                canReview: false,
                reason: 'You must have a completed booking for this field before leaving a review',
            };
        }

        return {
            canReview: true,
        };
    }
}