import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../services/toast.service';
import { LanguageService } from '../../../services/language.service';
import { DashboardService, DashboardStats, FieldStatus, UpcomingBooking, RevenueData } from '../../../services/dashboard.service';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';

type TimePeriod = 'today' | 'week' | 'month';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ManagerLayout, TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private toastService = inject(ToastService);
  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  private languageService = inject(LanguageService);

  // State signals
  stats = signal<DashboardStats | null>(null);
  fieldsStatus = signal<FieldStatus[]>([]);
  upcomingBookings = signal<UpcomingBooking[]>([]);
  revenueData = signal<RevenueData[]>([]);
  isLoading = signal(true);
  selectedPeriod = signal<TimePeriod>('today');
  currentLanguage = this.languageService.currentLanguage;

  // Computed values
  currentDate = computed(() => {
    const date = new Date();
    return date.toLocaleDateString(this.getCurrentLocale(), { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  });

  liveFields = computed(() => 
    this.fieldsStatus().filter(f => f.status === 'LIVE')
  );

  vacantFields = computed(() => 
    this.fieldsStatus().filter(f => f.status === 'VACANT')
  );

  maintenanceFields = computed(() => 
    this.fieldsStatus().filter(f => f.status === 'MAINTENANCE')
  );

  ngOnInit(): void {
    this.toastService.checkStoredToast();
    this.loadDashboardData();
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.isLoading.set(true);

    // Load stats
    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.toastService.error('Failed to load statistics', 3000);
      }
    });

    // Load fields status
    this.dashboardService.getFieldsStatus().subscribe({
      next: (fields) => {
        this.fieldsStatus.set(fields);
      },
      error: (error) => {
        console.error('Error loading fields status:', error);
      }
    });

    // Load upcoming bookings
    this.dashboardService.getUpcomingBookings().subscribe({
      next: (bookings) => {
        this.upcomingBookings.set(bookings);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.isLoading.set(false);
      }
    });

    // Load revenue data
    this.loadRevenueData(this.selectedPeriod());
  }

  /**
   * Load revenue data for selected period
   */
  loadRevenueData(period: TimePeriod): void {
    this.dashboardService.getRevenueData(period).subscribe({
      next: (data) => {
        this.revenueData.set(data);
      },
      error: (error) => {
        console.error('Error loading revenue data:', error);
      }
    });
  }

  /**
   * Change time period
   */
  changePeriod(period: TimePeriod): void {
    this.selectedPeriod.set(period);
    this.loadRevenueData(period);
  }

  /**
   * Navigate to add complex
   */
  navigateToAddComplex(): void {
    this.router.navigate(['manager', 'complex', 'new']);
  }

  /**
   * Navigate to all fields
   */
  navigateToAllFields(): void {
    this.router.navigate(['manager', 'fields']);
  }

  /**
   * Navigate to full schedule
   */
  navigateToSchedule(): void {
    this.router.navigate(['manager', 'bookings']);
  }

  /**
   * Navigate to booking details
   */
  viewBookingDetails(bookingId: number): void {
    this.router.navigate(['manager', 'bookings', bookingId]);
  }

  /**
   * Get current locale for date formatting
   */
  private getCurrentLocale(): string {
    const lang = this.currentLanguage();
    return lang === 'ar' ? 'ar-TN' : lang === 'fr' ? 'fr-FR' : 'en-US';
  }

  /**
   * Get trend icon
   */
  getTrendIcon(change: number): string {
    return change >= 0 ? 'trending_up' : 'trending_down';
  }

  /**
   * Get trend color
   */
  getTrendColor(change: number): string {
    return change >= 0 ? 'text-primary' : 'text-red-500';
  }

  /**
   * Format time
   */
  formatTime(time: string): { hour: string; period: string } {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const isPM = hourNum >= 12;
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    
    return {
      hour: `${displayHour}:${minute}`,
      period: isPM ? 'PM' : 'AM'
    };
  }

  /**
   * Get field status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'LIVE':
        return 'bg-primary/20 text-primary border-primary/20 animate-pulse';
      case 'VACANT':
        return 'bg-slate-700 text-slate-300 border-slate-600';
      case 'MAINTENANCE':
        return 'bg-accent-orange/20 text-accent-orange border-accent-orange/20';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  }

  /**
   * Refresh dashboard
   */
  refreshDashboard(): void {
    this.loadDashboardData();
    this.toastService.success('Dashboard refreshed', 2000);
  }
}