import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new review for a field' })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    type: Review,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - No completed booking or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Field not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already reviewed this field',
  })
  async create(
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    return this.reviewService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews with optional filters' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'fieldId',
    required: false,
    type: Number,
    description: 'Filter by field ID',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    type: Number,
    description: 'Minimum rating (1-5)',
  })
  @ApiQuery({
    name: 'maxRating',
    required: false,
    type: Number,
    description: 'Maximum rating (1-5)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reviews',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Review' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('fieldId') fieldId?: string,
    @Query('userId') userId?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
  ) {
    return this.reviewService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      fieldId: fieldId ? parseInt(fieldId) : undefined,
      userId: userId ? parseInt(userId) : undefined,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
    });
  }

  @Get('field/:fieldId/average')
  @ApiOperation({ summary: 'Get average rating for a field' })
  @ApiResponse({
    status: 200,
    description: 'Average rating and distribution',
    schema: {
      type: 'object',
      properties: {
        fieldId: { type: 'number' },
        averageRating: { type: 'number' },
        totalReviews: { type: 'number' },
        ratingDistribution: {
          type: 'object',
          properties: {
            1: { type: 'number' },
            2: { type: 'number' },
            3: { type: 'number' },
            4: { type: 'number' },
            5: { type: 'number' },
          },
        },
      },
    },
  })
  async getFieldAverage(@Param('fieldId', ParseIntPipe) fieldId: number) {
    return this.reviewService.getFieldAverageRating(fieldId);
  }

  @Get('can-review/:fieldId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user can review a field' })
  @ApiResponse({
    status: 200,
    description: 'Review eligibility check',
    schema: {
      type: 'object',
      properties: {
        canReview: { type: 'boolean' },
        reason: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async canReview(
    @Request() req,
    @Param('fieldId', ParseIntPipe) fieldId: number,
  ) {
    return this.reviewService.canUserReviewField(req.user.id, fieldId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiResponse({
    status: 200,
    description: 'Review found',
    type: Review,
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Review> {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
    type: Review,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only update own reviews',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    return this.reviewService.update(id, req.user.id, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'Review deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only delete own reviews (unless admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.reviewService.remove(id, req.user.id, req.user.role);
  }
}