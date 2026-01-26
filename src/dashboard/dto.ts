// src/dashboard/dto/dashboard-stats.dto.ts
export class DashboardStatsDto {
    totalRevenue: number;
    revenueChange: number;
    occupancyRate: number;
    occupancyChange: number;
    todayBookings: number;
    bookingsChange: number;
    slotsLeft: number;
    newCustomers: number;
    customersChange: number;
}

// src/dashboard/dto/revenue-data.dto.ts
export class RevenueDataDto {
    day: string;
    revenue: number;
    occupancy: number;
}

// src/dashboard/dto/field-status.dto.ts
export class CurrentBookingDto {
    team1: string;
    team2: string;
    timeLeft: number;
}

export class FieldStatusDto {
    id: number;
    name: string;
    type: string;
    status: 'LIVE' | 'VACANT' | 'MAINTENANCE';
    currentBooking?: CurrentBookingDto;
    maintenanceNote?: string;
}

// src/dashboard/dto/upcoming-booking.dto.ts
export class UpcomingBookingDto {
    id: number;
    time: string;
    teamName: string;
    fieldName: string;
    fieldType: string;
    isPending: boolean;
}

// src/dashboard/dto/query-period.dto.ts
import { IsEnum, IsOptional } from 'class-validator';

export enum TimePeriod {
    TODAY = 'today',
    WEEK = 'week',
    MONTH = 'month'
}

export class QueryPeriodDto {
    @IsOptional()
    @IsEnum(TimePeriod)
    period?: TimePeriod = TimePeriod.TODAY;
}