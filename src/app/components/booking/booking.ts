// booking-page.component.ts
import { Component, signal, computed, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../ui/button/button';
import { CardComponent } from '../ui/card/card';
import { FormsModule } from '@angular/forms';
import { NavbarMain } from '../common/navbar-main/navbar-main';
import { FooterMain } from '../common/footer-main/footer-main';

interface Field {
  id: string;
  name: string;
  location: string;
  price: number;
  image: string;
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
export class Booking implements OnInit {
  fieldId = signal<string>('1');
  includeEquipment = signal(false);
  includeLights = signal(false);

  ngOnInit(): void {
  }

  // Mock field data - in real app, this would come from a service
  field = computed(() => {
    const fields: Field[] = [
      {
        id: '1',
        name: 'Elite Sports Arena',
        location: 'Downtown, City Center',
        price: 50,
        image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80'
      },
      {
        id: '2',
        name: 'Green Valley Stadium',
        location: 'North District',
        price: 45,
        image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80'
      },
      {
        id: '3',
        name: 'Sunset Sports Complex',
        location: 'West Side',
        price: 40,
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'
      }
    ];
    return fields.find(f => f.id === this.fieldId());
  });

  // Booking state
  selectedDate = signal(this.getTodayDate());
  selectedTimeSlot = signal<string>('');
  selectedDuration = signal<number>(1);

  // Available options
  timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  durations = [1, 2, 3, 4];

  // Computed values
  basePrice = computed(() => {
    if (!this.field() || !this.selectedDuration()) return 0;
    return this.field()!.price * this.selectedDuration();
  });

  totalPrice = computed(() => {
    let total = this.basePrice();
    if (this.includeEquipment()) total += 10;
    if (this.includeLights()) total += 15;
    return total;
  });

  canConfirmBooking = computed(() => {
    return !!(this.selectedDate() && this.selectedTimeSlot() && this.selectedDuration());
  });

  get minDate(): string {
    return this.getTodayDate();
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

  getTimeSlotClass(slot: string): string {
    const base = 'border-2 text-sm';
    const selected = 'border-primary bg-primary text-background-dark';
    const unselected = 'border-gray-200 dark:border-white/10 bg-white dark:bg-surface-card text-gray-900 dark:text-white hover:border-primary hover:bg-primary/10';

    return `${base} ${this.selectedTimeSlot() === slot ? selected : unselected}`;
  }

  getDurationClass(duration: number): string {
    const base = 'border-2';
    const selected = 'border-primary bg-primary text-background-dark';
    const unselected = 'border-gray-200 dark:border-white/10 bg-white dark:bg-surface-card text-gray-900 dark:text-white hover:border-primary hover:bg-primary/10';

    return `${base} ${this.selectedDuration() === duration ? selected : unselected}`;
  }

  confirmBooking() {
    if (!this.canConfirmBooking()) {
      alert('Please fill all required fields');
      return;
    }

    // In real app, this would call a booking service
    alert('Booking confirmed! Redirecting to your bookings...');
    console.log('Booking details:', {
      field: this.field(),
      date: this.selectedDate(),
      time: this.selectedTimeSlot(),
      duration: this.selectedDuration(),
      equipment: this.includeEquipment(),
      lights: this.includeLights(),
      total: this.totalPrice()
    });
  }

  goBack() {
    // In real app, this would use Router to navigate
    window.history.back();
  }
}

// Don't forget to add FormsModule to imports if using ngModel
// imports: [CommonModule, FormsModule, ButtonComponent, CardComponent]