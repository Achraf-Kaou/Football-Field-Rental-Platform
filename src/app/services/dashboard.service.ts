import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

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

export interface RevenueData {
  day: string;
  revenue: number;
  occupancy: number;
}

export interface FieldStatus {
  id: number;
  name: string;
  type: string;
  status: 'LIVE' | 'VACANT' | 'MAINTENANCE';
  currentBooking?: {
    team1: string;
    team2: string;
    timeLeft: number;
  };
  maintenanceNote?: string;
}

export interface UpcomingBooking {
  id: number;
  time: string;
  teamName: string;
  fieldName: string;
  fieldType: string;
  isPending: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl || 'http://localhost:3000';

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/dashboard/stats`);
  }

  /**
   * Get revenue chart data
   */
  getRevenueData(period: 'today' | 'week' | 'month'): Observable<RevenueData[]> {
    return this.http.get<RevenueData[]>(`${this.API_URL}/dashboard/revenue`, {
      params: { period }
    });
  }

  /**
   * Get live field status
   */
  getFieldsStatus(): Observable<FieldStatus[]> {
    return this.http.get<FieldStatus[]>(`${this.API_URL}/dashboard/fields/status`);
  }

  /**
   * Get upcoming bookings
   */
  getUpcomingBookings(): Observable<UpcomingBooking[]> {
    return this.http.get<UpcomingBooking[]>(`${this.API_URL}/dashboard/bookings/upcoming`);
  }

  /**
   * Get manager complexes count
   */
  getComplexesCount(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/dashboard/complexes/count`);
  }

  /**
   * Get total fields count
   */
  getFieldsCount(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/dashboard/fields/count`);
  }
}