import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { combineLatest, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { FieldService } from './field.service';
import { FieldModel } from '../models/field.model';

export type TimePeriod = 'today' | 'week' | 'month';

export interface DashboardStats {
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

export interface FieldStatus {
  id: number;
  name: string;
  type?: string;
  status: 'available' | 'maintenance' | 'blocked';
  maintenanceNote?: string;
  currentBooking?: {
    startAt: string;
    endAt: string;
    timeLeft: number; // minutes
    team1: string;
    team2: string;
  };
}

export interface UpcomingBooking {
  id: number;
  time: string; // HH:mm
  teamName: string;
  fieldName: string;
  fieldType?: string;
  isPending: boolean;
}

export interface RevenueData {
  label: string; // e.g. hour or day label
  revenue: number; // proxy: count confirmed bookings
  occupancy: number; // percent of fields active in the bucket
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private fieldApi = inject(FieldService);
  private apiUrl = environment.apiUrl;

  // Helper to call /bookings with arbitrary filters WITHOUT changer BookingService
  private getBookings(paramsObj: Record<string, string | number | undefined>): Observable<any[]> {
    let params = new HttpParams();
    Object.entries(paramsObj).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<any[]>(`${this.apiUrl}/bookings`, { params });
  }

  getDashboardStats(): Observable<DashboardStats> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(endOfToday);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);

    const fields$ = this.fieldApi.getAllFields(1, 1000);
    const todayBookings$ = this.getBookings({
      startDate: startOfToday.toISOString(),
      endDate: endOfToday.toISOString(),
    });

    const yesterdayBookings$ = this.getBookings({
      startDate: startOfYesterday.toISOString(),
      endDate: endOfYesterday.toISOString(),
    });

    const liveNowBookings$ = this.getBookings({
      startDate: startOfToday.toISOString(),
      endDate: endOfToday.toISOString(),
      status: 'completed',
    }).pipe(
      map(bookings => bookings.filter(b => {
        const s = new Date(b.startAt).getTime();
        const e = new Date(b.endAt).getTime();
        const t = now.getTime();
        return s <= t && e > t;
      }))
    );

    return combineLatest([fields$, todayBookings$, yesterdayBookings$, liveNowBookings$]).pipe(
      map(([fields, today, yesterday, liveNow]) => {
        const totalFields = fields.length;
        const liveCount = new Set(liveNow.map(b => b.fieldId)).size;
        const occupancy = totalFields > 0 ? Math.round((liveCount / totalFields) * 100) : 0;

        const todayConfirmed = today.filter(b => b.status === 'completed');
        const yesterdayConfirmed = yesterday.filter(b => b.status === 'completed');

        // Revenue proxy: count confirmed bookings (remplacez par somme des prix si disponible)
        const todayRevenue = todayConfirmed.length;
        const yesterdayRevenue = yesterdayConfirmed.length;

        const pctChange = (curr: number, prev: number) => {
          if (prev === 0 && curr === 0) return 0;
          if (prev === 0) return 100;
          return Math.round(((curr - prev) / prev) * 100);
        };

        const distinctUsersToday = new Set(today.map(b => b.userId)).size;
        const distinctUsersYesterday = new Set(yesterday.map(b => b.userId)).size;

        return {
          totalRevenue: todayRevenue,
          revenueChange: pctChange(todayRevenue, yesterdayRevenue),
          occupancyRate: occupancy,
          occupancyChange: pctChange(occupancy, this.estimateYesterdayOccupancy(yesterday, totalFields)),
          todayBookings: today.length,
          bookingsChange: pctChange(today.length, yesterday.length),
          slotsLeft: Math.max(totalFields - liveCount, 0),
          newCustomers: distinctUsersToday,
          customersChange: pctChange(distinctUsersToday, distinctUsersYesterday),
        } as DashboardStats;
      })
    );
  }

  getFieldsStatus(): Observable<FieldStatus[]> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const fields$ = this.fieldApi.getAllFields(1, 1000);
    const todayBookings$ = this.getBookings({
      startDate: startOfToday.toISOString(),
      endDate: endOfToday.toISOString(),
      status: 'completed',
    });

    return combineLatest([fields$, todayBookings$]).pipe(
      map(([fields, bookings]) => {
        const byField = new Map<number, any[]>();
        bookings.forEach(b => {
          if (!byField.has(b.fieldId)) byField.set(b.fieldId, []);
          byField.get(b.fieldId)!.push(b);
        });

        return fields.map(f => {
          const current = (byField.get(f.id) || []).find(b => {
            const s = new Date(b.startAt).getTime();
            const e = new Date(b.endAt).getTime();
            const t = now.getTime();
            return s <= t && e > t;
          });

          const rawStatus = (f as any)?.status;
          const isMaintenance = rawStatus === 'MAINTENANCE' || rawStatus === 'maintenance';
          const status: FieldStatus['status'] = isMaintenance ? 'maintenance' : current ? 'available' : 'blocked';

          const currentBooking = current
            ? {
                startAt: current.startAt,
                endAt: current.endAt,
                timeLeft: Math.max(Math.round((new Date(current.endAt).getTime() - now.getTime()) / 60000), 0),
                team1: current.user?.firstName ?? 'TM1',
                team2: current.user?.lastName ?? 'TM2',
              }
            : undefined;

          return {
            id: f.id,
            name: f.name,
            type: (f as any)?.type,
            status,
            maintenanceNote: isMaintenance ? 'Under maintenance' : undefined,
            currentBooking,
          } as FieldStatus;
        });
      })
    );
  }

  getUpcomingBookings(hoursAhead = 24): Observable<UpcomingBooking[]> {
    const now = new Date();
    const end = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    return this.getBookings({
      startDate: now.toISOString(),
      endDate: end.toISOString(),
      sortedBy: 'startAt',
      sortedDirection: 'asc',
    }).pipe(
      map(bookings => bookings
        .sort((a: any, b: any) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, 20)
        .map(b => {
          const start = new Date(b.startAt);
          const hh = start.getHours().toString().padStart(2, '0');
          const mm = start.getMinutes().toString().padStart(2, '0');
          return {
            id: b.id,
            time: `${hh}:${mm}`,
            teamName: b.user ? `${b.user.firstName} ${b.user.lastName}` : 'Match',
            fieldName: b.field?.name ?? `Field #${b.fieldId}`,
            fieldType: b.field?.type,
            isPending: b.status === 'pending',
          } as UpcomingBooking;
        })
      )
    );
  }

  getRevenueData(period: TimePeriod): Observable<RevenueData[]> {
    const now = new Date();

    const [start, end, granularity] = (() => {
      if (period === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return [startOfToday, endOfToday, 'hour'] as const;
      }
      if (period === 'week') {
        const day = now.getDay(); // 0..6
        const diffToMonday = (day + 6) % 7;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return [startOfWeek, endOfWeek, 'day'] as const;
      }
      // month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return [startOfMonth, endOfMonth, 'day'] as const;
    })();

    return combineLatest([
      this.fieldApi.getAllFields(1, 1000),
      this.getBookings({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status: 'confirmed',
      }),
    ]).pipe(
      map(([fields, bookings]) => {
        const buckets = new Map<string, { revenue: number; liveFields: Set<number> }>();

        const labelFor = (date: Date) => {
          if (granularity === 'hour') {
            const hh = date.getHours().toString().padStart(2, '0');
            return `${hh}:00`;
          }
          const dd = date.getDate().toString().padStart(2, '0');
          const mm = (date.getMonth() + 1).toString().padStart(2, '0');
          return `${dd}/${mm}`;
        };

        bookings.forEach(b => {
          const startAt = new Date(b.startAt);
          const label = labelFor(startAt);
          if (!buckets.has(label)) buckets.set(label, { revenue: 0, liveFields: new Set<number>() });
          const bucket = buckets.get(label)!;
          bucket.revenue += 1; // proxy: +1 per confirmed booking
          bucket.liveFields.add(b.fieldId);
        });

        const totalFields = fields.length || 1;

        return Array.from(buckets.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([label, { revenue, liveFields }]) => ({
            label,
            revenue,
            occupancy: Math.round((liveFields.size / totalFields) * 100),
          }));
      })
    );
  }

  private estimateYesterdayOccupancy(yesterdayBookings: any[], totalFields: number): number {
    if (totalFields === 0) return 0;
    const confirmed = yesterdayBookings.filter(b => b.status === 'confirmed');
    const fieldsBooked = new Set(confirmed.map(b => b.fieldId)).size;
    return Math.round((fieldsBooked / totalFields) * 100);
  }
}