// booking-page.component.ts
import { Component, signal, computed, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button';
import { CardComponent } from '../../ui/card/card';
import { FormsModule } from '@angular/forms';
import { NavbarMain } from '../../common/navbar-main/navbar-main';
import { FooterMain } from '../../common/footer-main/footer-main';
import { ActivatedRoute } from '@angular/router';
import { FieldService } from '../../../services/field.service';
import { FieldModel } from '../../../models/field.model';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

interface TimeSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'maintenance' | 'blocked';
  notes?: string;
  recurring?: boolean;
  createdAt: string;
}

interface BookingForm {
  startTime: string;
  endTime: string;
  duration: number;
  includeEquipment: boolean;
  includeLights: boolean;
  notes: string;
}

interface HourlySlot {
  time: string;
  isAvailable: boolean;
  isBooked: boolean;
  isBlocked: boolean;
  isMaintenance: boolean;
  bookingId?: number;
  notes?: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ButtonComponent, CardComponent, FormsModule, NavbarMain, FooterMain],
  templateUrl: './booking.html',
  styles: [`
    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0.5);
    }

    .dark input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1);
    }
  `]
})
export class BookingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fieldsService = inject(FieldService);
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  fieldId = signal<number>(0);
  field = signal<FieldModel | null>(null);
  bookings = signal<Booking[]>([]);
  slots = signal<TimeSlot[]>([]);

  // Calendar state
  selectedDate = signal(this.getTodayDate());
  openingHour = signal<number>(8);
  closingHour = signal<number>(22);
  
  // Modal state
  showBookingModal = signal<boolean>(false);
  selectedTime = signal<string>('');

  // Booking form
  bookingForm = signal<BookingForm>({
    startTime: '',
    endTime: '',
    duration: 1,
    includeEquipment: false,
    includeLights: false,
    notes: ''
  });

  // Available durations in hours
  durations = [1, 1.25, 1.5, 1.75, 2];

  // Computed: Generate hourly slots for the calendar view
  timeSlots = computed(() => {
    const openHour = this.openingHour();
    const closeHour = this.closingHour();
    const slotCount = closeHour - openHour;
    
    return Array.from({ length: slotCount }, (_, i) => {
      const hour = i + openHour;
      return `${hour.toString().padStart(2, '0')}:00`;
    });
  });

  // Computed: Analyze each hourly slot for availability
  hourlySlots = computed(() => {
    const slots: HourlySlot[] = [];
    const times = this.timeSlots();
    const selectedDate = this.selectedDate();
    
    for (const time of times) {
      const slot = this.analyzeTimeSlot(time, selectedDate);
      slots.push(slot);
    }
    
    return slots;
  });

  // Computed: Filter bookings for selected date
  filteredBookings = computed(() => {
    const selectedDateStr = this.selectedDate();
    return this.bookings().filter(booking => {
      const bookingDate = new Date(booking.startAt).toISOString().split('T')[0];
      return bookingDate === selectedDateStr;
    });
  });

  // Computed: Filter slots (blocked/maintenance) for selected date
  filteredSlots = computed(() => {
    return this.slots().filter(
      slot => slot.date === this.selectedDate()
    );
  });

  // Computed: Check which durations are available for selected time
  availableDurations = computed(() => {
    const selectedTime = this.selectedTime();
    if (!selectedTime) return [];

    return this.durations.filter(duration => 
      this.canBookDuration(selectedTime, duration)
    );
  });

  // Computed: Total price
  totalPrice = computed(() => {
    if (!this.field()) return 0;
    let total = this.field()!.price * this.bookingForm().duration;
    if (this.bookingForm().includeEquipment) total += 10;
    if (this.bookingForm().includeLights) total += 15;
    return total;
  });

  get minDate(): string {
    return this.getTodayDate();
  }

  constructor() {
    effect(() => {
      console.log('Selected date:', this.selectedDate());
      console.log('Hourly slots:', this.hourlySlots());
      console.log('Filtered bookings:', this.filteredBookings().length);
      console.log('Filtered slots:', this.filteredSlots().length);
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idField');
    if (id) {
      this.fieldId.set(Number(id));
      this.getFieldById(this.fieldId());
    }
  }

  getFieldById(id: number) {
    this.fieldsService.getFieldById(id).subscribe((field) => {
      this.field.set(field);
      this.bookings.set(field.bookings || []);

      // Extract availability slots (blocked/maintenance) from field
      if (field.availability && Array.isArray(field.availability)) {
        const fieldSlots = (field.availability as any[]).map(slot => ({
          ...slot,
          fieldId: field.id
        }));
        this.slots.set(fieldSlots);
      }

      // Set opening and closing hours from complex
      if (field.complex) {
        const openHour = parseInt(field.complex.openAt?.split(':')[0] || '8', 10);
        const closeHour = field.complex.closeAt === '00:00' ? 24 : parseInt(field.complex.closeAt?.split(':')[0] || '22', 10);

        this.openingHour.set(openHour);
        this.closingHour.set(closeHour);
      } else {
        this.openingHour.set(8);
        this.closingHour.set(22);
      }
    });
  }

  /**
   * Analyze a specific time slot to determine its availability status
   */
  analyzeTimeSlot(time: string, date: string): HourlySlot {
    const timeMinutes = this.timeToMinutes(time);
    const nextHourTime = this.minutesToTime(timeMinutes + 60);
    
    // Check if there's a booking at this time
    const booking = this.filteredBookings().find(b => {
      const bookingStart = this.timeToMinutes(
        new Date(b.startAt).toTimeString().slice(0, 5)
      );
      const bookingEnd = this.timeToMinutes(
        new Date(b.endAt).toTimeString().slice(0, 5)
      );
      
      // Check if this hourly slot overlaps with the booking
      return timeMinutes >= bookingStart && timeMinutes < bookingEnd;
    });
    
    if (booking) {
      return {
        time,
        isAvailable: false,
        isBooked: true,
        isBlocked: false,
        isMaintenance: false,
        bookingId: booking.id,
        notes: 'Booked'
      };
    }
    
    // Check if there's a blocked/maintenance slot at this time
    const blockedSlot = this.filteredSlots().find(slot => {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);
      
      // Check if this hourly slot overlaps with the blocked slot
      return timeMinutes >= slotStart && timeMinutes < slotEnd;
    });
    
    if (blockedSlot) {
      return {
        time,
        isAvailable: false,
        isBooked: false,
        isBlocked: blockedSlot.status === 'blocked',
        isMaintenance: blockedSlot.status === 'maintenance',
        notes: blockedSlot.notes || blockedSlot.status
      };
    }
    
    // If no booking or blocked slot, it's available
    return {
      time,
      isAvailable: true,
      isBooked: false,
      isBlocked: false,
      isMaintenance: false
    };
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onDateChange(value: string) {
    this.selectedDate.set(value);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Convert time string to minutes since midnight
   */
  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  /**
   * Convert minutes since midnight to time string
   */
  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Check if a time range overlaps with any existing booking
   */
  hasBookingConflict(startTime: string, endTime: string): boolean {
    const bookings = this.filteredBookings();
    const requestStart = this.timeToMinutes(startTime);
    const requestEnd = this.timeToMinutes(endTime);

    return bookings.some(booking => {
      const bookingStart = this.timeToMinutes(
        new Date(booking.startAt).toTimeString().slice(0, 5)
      );
      const bookingEnd = this.timeToMinutes(
        new Date(booking.endAt).toTimeString().slice(0, 5)
      );

      // Check for overlap: (StartA < EndB) and (EndA > StartB)
      return requestStart < bookingEnd && requestEnd > bookingStart;
    });
  }

  /**
   * Check if a time range overlaps with maintenance or blocked slots
   */
  hasSlotConflict(startTime: string, endTime: string): boolean {
    const slots = this.filteredSlots();
    const requestStart = this.timeToMinutes(startTime);
    const requestEnd = this.timeToMinutes(endTime);

    return slots.some(slot => {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);

      // Check for overlap
      return requestStart < slotEnd && requestEnd > slotStart;
    });
  }

  /**
   * Check if a duration can be booked starting from a specific time
   */
  canBookDuration(startTime: string, duration: number): boolean {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + (duration * 60);
    const endTime = this.minutesToTime(endMinutes);

    // Check if it exceeds closing time
    const closingMinutes = this.closingHour() * 60;
    if (endMinutes > closingMinutes) {
      return false;
    }

    // Check for booking conflicts
    if (this.hasBookingConflict(startTime, endTime)) {
      return false;
    }

    // Check for slot conflicts (maintenance/blocked)
    if (this.hasSlotConflict(startTime, endTime)) {
      return false;
    }

    return true;
  }

  openBookingModal(hourlySlot: HourlySlot) {
    if (!hourlySlot.isAvailable) {
      return;
    }

    this.selectedTime.set(hourlySlot.time);

    // Find available durations for this time
    const availableDurations = this.durations.filter(duration => 
      this.canBookDuration(hourlySlot.time, duration)
    );

    if (availableDurations.length === 0) {
      this.toastService.info('No durations available for this time slot', 5000);
      return;
    }

    // Default to the first available duration
    const defaultDuration = availableDurations[0];
    const endTime = this.calculateEndTime(hourlySlot.time, defaultDuration);

    this.bookingForm.set({
      startTime: hourlySlot.time,
      endTime: endTime,
      duration: defaultDuration,
      includeEquipment: false,
      includeLights: false,
      notes: ''
    });

    this.showBookingModal.set(true);
  }

  closeBookingModal() {
    this.showBookingModal.set(false);
    this.selectedTime.set('');
  }

  calculateEndTime(startTime: string, duration: number): string {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + (duration * 60);
    return this.minutesToTime(endMinutes);
  }

  updateBookingForm(field: keyof BookingForm, value: any) {
    this.bookingForm.update(current => {
      const updated = { ...current, [field]: value };

      // Recalculate end time when duration changes
      if (field === 'duration') {
        updated.endTime = this.calculateEndTime(updated.startTime, value);
      }

      return updated;
    });
  }

  getSlotClass(hourlySlot: HourlySlot): string {
    if (hourlySlot.isBooked) {
      return 'bg-red-500/20 border-red-500 cursor-not-allowed';
    }

    if (hourlySlot.isMaintenance) {
      return 'bg-orange-500/20 border-orange-500 cursor-not-allowed';
    }

    if (hourlySlot.isBlocked) {
      return 'bg-gray-500/20 border-gray-700 cursor-not-allowed';
    }

    if (hourlySlot.isAvailable) {
      return 'bg-emerald-500/20 border-emerald-500 hover:bg-emerald-500/30 cursor-pointer';
    }

    return 'bg-gray-500/20 border-gray-700 cursor-not-allowed';
  }

  getSlotTop(time: string): number {
    const [hour, min] = time.split(':').map(Number);
    const openHour = this.openingHour();
    const hoursSinceOpen = hour - openHour + (min / 60);
    return hoursSinceOpen * 64; // 64px per hour (h-16 = 64px)
  }

  getStatusLabel(hourlySlot: HourlySlot): string {
    if (hourlySlot.isBooked) return 'Booked';
    if (hourlySlot.isMaintenance) return 'Maintenance';
    if (hourlySlot.isBlocked) return 'Blocked';
    if (hourlySlot.isAvailable) return 'Available';
    return 'Unavailable';
  }

  getDurationClass(duration: number): string {
    const isActive = this.bookingForm().duration === duration;
    const isAvailable = this.availableDurations().includes(duration);
    
    if (!isAvailable) {
      return 'bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed opacity-50';
    }
    
    return isActive
      ? 'bg-primary text-white'
      : 'bg-gray-700 hover:bg-gray-600 text-white';
  }

  isDurationAvailable(duration: number): boolean {
    return this.availableDurations().includes(duration);
  }

  confirmBooking() {
    if (!this.selectedTime()) {
      this.toastService.warning('Please select a time slot', 3000);
      return;
    }

    const form = this.bookingForm();

    // Final validation
    if (!this.canBookDuration(form.startTime, form.duration)) {
      this.toastService.warning('This time slot is no longer available for the selected duration', 3000);
      return;
    }

    const [hours, minutes] = form.startTime.split(':').map(Number);
    const startDate = new Date(this.selectedDate());
    startDate.setHours(hours, minutes, 0, 0);

    const [endHours, endMinutes] = form.endTime.split(':').map(Number);
    const endDate = new Date(this.selectedDate());
    endDate.setHours(endHours, endMinutes, 0, 0);

    const user = this.authService.currentUser();
    console.log(user)

    const bookingData = {
      userId: user?.id || 0,
      fieldId: this.fieldId(),
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      status: 'pending' as const
    };

    this.bookingService.createBooking(bookingData).subscribe({
      next: (booking) => {
        this.toastService.success('Booking confirmed successfully!', 5000);
        this.closeBookingModal();

        // Refresh field data to get updated bookings
        this.getFieldById(this.fieldId());
      },
      error: (err) => {
        console.error('Error creating booking:', err);
        this.toastService.error('Failed to create booking. Please try again.', 3000);
      }
    });
  }

  goBack() {
    window.history.back();
  }

  getSlotContainerHeight(): number {
    const slotCount = this.timeSlots().length;
    return slotCount * 64; // 64px per hour (h-16 = 64px for md screens, h-14 = 56px for sm)
  }
}