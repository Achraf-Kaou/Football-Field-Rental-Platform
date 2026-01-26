// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    DashboardStatsDto,
    RevenueDataDto,
    FieldStatusDto,
    UpcomingBookingDto,
    TimePeriod,
    CurrentBookingDto,
} from './dto';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(userId: number): Promise<DashboardStatsDto> {
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);

        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

        // Get user's complexes
        const complexes = await this.prisma.complex.findMany({
            where: { deletedAt: null },
            include: { fields: true },
        });

        const fieldIds = complexes.flatMap(c => c.fields.map(f => f.id));

        // Total Revenue (this week)
        const thisWeekBookings = await this.prisma.booking.findMany({
            where: {
                fieldId: { in: fieldIds },
                createdAt: { gte: startOfWeek },
                status: { in: ['CONFIRMED', 'COMPLETED'] },
                deletedAt: null,
            },
            include: { field: true },
        });

        const lastWeekBookings = await this.prisma.booking.findMany({
            where: {
                fieldId: { in: fieldIds },
                createdAt: { gte: startOfLastWeek, lt: startOfWeek },
                status: { in: ['CONFIRMED', 'COMPLETED'] },
                deletedAt: null,
            },
            include: { field: true },
        });

        const totalRevenue = thisWeekBookings.reduce((sum, b) => sum + b.field.price, 0);
        const lastWeekRevenue = lastWeekBookings.reduce((sum, b) => sum + b.field.price, 0);
        const revenueChange = lastWeekRevenue > 0
            ? ((totalRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
            : 0;

        // Today's Bookings
        const todayBookings = await this.prisma.booking.count({
            where: {
                fieldId: { in: fieldIds },
                startAt: { gte: startOfToday },
                deletedAt: null,
            },
        });

        const yesterdayBookings = await this.prisma.booking.count({
            where: {
                fieldId: { in: fieldIds },
                startAt: { gte: startOfYesterday, lt: startOfToday },
                deletedAt: null,
            },
        });

        const bookingsChange = yesterdayBookings > 0
            ? ((todayBookings - yesterdayBookings) / yesterdayBookings) * 100
            : 0;

        // Calculate available slots for today
        const totalFields = fieldIds.length;
        const hoursPerDay = 16; // Assuming 8:00 AM to 12:00 AM
        const totalSlots = totalFields * hoursPerDay;
        const slotsLeft = totalSlots - todayBookings;

        // Occupancy Rate (today)
        const occupancyRate = totalSlots > 0
            ? ((todayBookings / totalSlots) * 100).toFixed(0)
            : 0;

        const yesterdayOccupancy = await this.prisma.booking.count({
            where: {
                fieldId: { in: fieldIds },
                startAt: { gte: startOfYesterday, lt: startOfToday },
                deletedAt: null,
            },
        });

        const yesterdayOccupancyRate = totalSlots > 0
            ? (yesterdayOccupancy / totalSlots) * 100
            : 0;

        const occupancyChange = yesterdayOccupancyRate > 0
            ? ((Number(occupancyRate) - yesterdayOccupancyRate) / yesterdayOccupancyRate) * 100
            : 0;

        // New Customers (this week)
        const newCustomersThisWeek = await this.prisma.user.count({
            where: {
                createdAt: { gte: startOfWeek },
                role: 'USER',
                deletedAt: null,
            },
        });

        const newCustomersLastWeek = await this.prisma.user.count({
            where: {
                createdAt: { gte: startOfLastWeek, lt: startOfWeek },
                role: 'USER',
                deletedAt: null,
            },
        });

        const customersChange = newCustomersLastWeek > 0
            ? ((newCustomersThisWeek - newCustomersLastWeek) / newCustomersLastWeek) * 100
            : 0;

        return {
            totalRevenue: Math.round(totalRevenue),
            revenueChange: Math.round(revenueChange),
            occupancyRate: Number(occupancyRate),
            occupancyChange: Math.round(occupancyChange),
            todayBookings,
            bookingsChange: Math.round(bookingsChange),
            slotsLeft,
            newCustomers: newCustomersThisWeek,
            customersChange: Math.round(customersChange),
        };
    }

    /**
     * Get revenue data for chart
     */
    async getRevenueData(period: TimePeriod): Promise<RevenueDataDto[]> {
        const now = new Date();
        let startDate: Date;
        let days: number;

        switch (period) {
            case TimePeriod.TODAY:
                startDate = new Date(now.setHours(0, 0, 0, 0));
                days = 1;
                break;
            case TimePeriod.WEEK:
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                days = 7;
                break;
            case TimePeriod.MONTH:
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
                days = 30;
                break;
        }

        const complexes = await this.prisma.complex.findMany({
            where: { deletedAt: null },
            include: { fields: true },
        });

        const fieldIds = complexes.flatMap(c => c.fields.map(f => f.id));

        const bookings = await this.prisma.booking.findMany({
            where: {
                fieldId: { in: fieldIds },
                createdAt: { gte: startDate },
                deletedAt: null,
            },
            include: { field: true },
        });

        // Group by day
        const revenueByDay = new Map<string, { revenue: number; bookings: number }>();

        bookings.forEach(booking => {
            const day = booking.createdAt.toISOString().split('T')[0];
            const current = revenueByDay.get(day) || { revenue: 0, bookings: 0 };
            revenueByDay.set(day, {
                revenue: current.revenue + booking.field.price,
                bookings: current.bookings + 1,
            });
        });

        // Generate data for each day
        const result: RevenueDataDto[] = [];
        const totalFields = fieldIds.length;
        const hoursPerDay = 16;
        const totalSlots = totalFields * hoursPerDay;

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dayKey = date.toISOString().split('T')[0];
            const dayData = revenueByDay.get(dayKey) || { revenue: 0, bookings: 0 };

            const dayName = period === TimePeriod.WEEK
                ? date.toLocaleDateString('en-US', { weekday: 'short' })
                : date.getDate().toString();

            result.push({
                day: dayName,
                revenue: dayData.revenue,
                occupancy: totalSlots > 0 ? (dayData.bookings / totalSlots) * 100 : 0,
            });
        }

        return result;
    }

    /**
     * Get live field status
     */
    async getFieldsStatus(): Promise<FieldStatusDto[]> {
        const now = new Date();

        const fields = await this.prisma.field.findMany({
            where: { deletedAt: null },
            include: {
                bookings: {
                    where: {
                        startAt: { lte: now },
                        endAt: { gte: now },
                        deletedAt: null,
                    },
                    include: {
                        user: true,
                    },
                },
            },
        });

        return fields.map(field => {
            let status: 'LIVE' | 'VACANT' | 'MAINTENANCE' = 'VACANT';
            let currentBooking: CurrentBookingDto | undefined;
            let maintenanceNote: string | undefined;

            // Check if field is in maintenance
            if (field.status === 'MAINTENANCE') {
                status = 'MAINTENANCE';
                maintenanceNote = 'Under maintenance';
            }
            // Check if field has active booking
            else if (field.bookings && field.bookings.length > 0) {
                status = 'LIVE';
                const booking = field.bookings[0];
                const timeLeft = Math.round((booking.endAt.getTime() - now.getTime()) / 60000);

                currentBooking = {
                    team1: booking.user.firstName + ' ' + booking.user.lastName,
                    team2: 'Opponent', // You may need to adjust this based on your data
                    timeLeft,
                };
            }

            return {
                id: field.id,
                name: field.name,
                type: field.type,
                status,
                currentBooking,
                maintenanceNote,
            };
        });
    }

    /**
     * Get upcoming bookings
     */
    async getUpcomingBookings(): Promise<UpcomingBookingDto[]> {
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const bookings = await this.prisma.booking.findMany({
            where: {
                startAt: { gte: now, lte: endOfDay },
                deletedAt: null,
            },
            include: {
                user: true,
                field: true,
            },
            orderBy: { startAt: 'asc' },
            take: 10,
        });

        return bookings.map(booking => ({
            id: booking.id,
            time: booking.startAt.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            teamName: `${booking.user.firstName} ${booking.user.lastName}`,
            fieldName: booking.field.name,
            fieldType: booking.field.type,
            isPending: booking.status === 'PENDING',
        }));
    }

    /**
     * Get complexes count
     */
    async getComplexesCount(): Promise<number> {
        return this.prisma.complex.count({
            where: { deletedAt: null },
        });
    }

    /**
     * Get fields count
     */
    async getFieldsCount(): Promise<number> {
        return this.prisma.field.count({
            where: { deletedAt: null },
        });
    }
}