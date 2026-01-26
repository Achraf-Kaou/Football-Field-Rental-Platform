// src/dashboard/dashboard.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  DashboardStatsDto,
  RevenueDataDto,
  FieldStatusDto,
  UpcomingBookingDto,
  QueryPeriodDto,
  TimePeriod,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  /**
   * GET /dashboard/stats
   * Get dashboard statistics
   */
  @Get('stats')
  async getDashboardStats(@Request() req): Promise<DashboardStatsDto> {
    return this.dashboardService.getDashboardStats(req.user.id);
  }

  /**
   * GET /dashboard/revenue?period=today|week|month
   * Get revenue chart data
   */
  @Get('revenue')
  async getRevenueData(
    @Query() query: QueryPeriodDto,
  ): Promise<RevenueDataDto[]> {
    return this.dashboardService.getRevenueData(
      query.period || TimePeriod.TODAY,
    );
  }

  /**
   * GET /dashboard/fields/status
   * Get live field status
   */
  @Get('fields/status')
  async getFieldsStatus(): Promise<FieldStatusDto[]> {
    return this.dashboardService.getFieldsStatus();
  }

  /**
   * GET /dashboard/bookings/upcoming
   * Get upcoming bookings
   */
  @Get('bookings/upcoming')
  async getUpcomingBookings(): Promise<UpcomingBookingDto[]> {
    return this.dashboardService.getUpcomingBookings();
  }

  /**
   * GET /dashboard/complexes/count
   * Get total complexes count
   */
  @Get('complexes/count')
  async getComplexesCount(): Promise<{ count: number }> {
    const count = await this.dashboardService.getComplexesCount();
    return { count };
  }

  /**
   * GET /dashboard/fields/count
   * Get total fields count
   */
  @Get('fields/count')
  async getFieldsCount(): Promise<{ count: number }> {
    const count = await this.dashboardService.getFieldsCount();
    return { count };
  }
}