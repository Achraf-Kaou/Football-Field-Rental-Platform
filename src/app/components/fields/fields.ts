import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../ui/button/button';
import { CardComponent } from '../ui/card/card';
import { FooterMain } from '../common/footer-main/footer-main';
import { NavbarMain } from '../common/navbar-main/navbar-main';

interface Field {
  id: string;
  name: string;
  location: string;
  type: 'indoor' | 'outdoor';
  size: '5v5' | '7v7' | '11v11';
  surface: 'grass' | 'artificial';
  price: number;
  rating: number;
  image: string;
  amenities: string[];
}

@Component({
  selector: 'app-fields',
  standalone: true,
  imports: [CommonModule, ButtonComponent, CardComponent, NavbarMain, FooterMain],
  templateUrl: './fields.html',
  styles: [`
    @keyframes slide-down {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-slide-down {
      animation: slide-down 0.3s ease-out;
    }

    .line-clamp-1 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }

    select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    select:focus {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2349E619' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    }
  `]
})
export class Fields {
  // Filter signals
  searchQuery = signal('');
  typeFilter = signal<string>('all');
  sizeFilter = signal<string>('all');
  surfaceFilter = signal<string>('all');
  showMobileFilters = signal(false);

  // Mock data
  fields = signal<Field[]>([
    {
      id: '1',
      name: 'Elite Sports Arena',
      location: 'Downtown, City Center',
      type: 'indoor',
      size: '5v5',
      surface: 'artificial',
      price: 50,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80',
      amenities: ['Parking', 'Showers', 'Lockers']
    },
    {
      id: '2',
      name: 'Green Valley Stadium',
      location: 'North District',
      type: 'outdoor',
      size: '7v7',
      surface: 'grass',
      price: 45,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80',
      amenities: ['Parking', 'Cafe', 'WiFi']
    },
    {
      id: '3',
      name: 'Sunset Sports Complex',
      location: 'West Side',
      type: 'outdoor',
      size: '11v11',
      surface: 'artificial',
      price: 40,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
      amenities: ['Parking', 'Lights', 'Seating']
    },
    {
      id: '4',
      name: 'Urban Football Hub',
      location: 'East Quarter',
      type: 'indoor',
      size: '5v5',
      surface: 'artificial',
      price: 55,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80',
      amenities: ['AC', 'Showers', 'Cafe']
    },
    {
      id: '5',
      name: 'Champions League Field',
      location: 'South Park',
      type: 'outdoor',
      size: '11v11',
      surface: 'grass',
      price: 60,
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80',
      amenities: ['Parking', 'Lights', 'Professional']
    },
    {
      id: '6',
      name: 'Quick Match Arena',
      location: 'Central Plaza',
      type: 'indoor',
      size: '7v7',
      surface: 'artificial',
      price: 48,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
      amenities: ['WiFi', 'Showers', 'Parking']
    }
  ]);

  // Computed filtered fields
  filteredFields = computed(() => {
    return this.fields().filter(field => {
      const matchesSearch =
        field.name.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
        field.location.toLowerCase().includes(this.searchQuery().toLowerCase());

      const matchesType = this.typeFilter() === 'all' || field.type === this.typeFilter();
      const matchesSize = this.sizeFilter() === 'all' || field.size === this.sizeFilter();
      const matchesSurface = this.surfaceFilter() === 'all' || field.surface === this.surfaceFilter();

      return matchesSearch && matchesType && matchesSize && matchesSurface;
    });
  });

  // Check if any filters are active
  hasActiveFilters = computed(() => {
    return this.typeFilter() !== 'all' ||
      this.sizeFilter() !== 'all' ||
      this.surfaceFilter() !== 'all' ||
      this.searchQuery() !== '';
  });

  toggleMobileFilters() {
    this.showMobileFilters.update(v => !v);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.typeFilter.set('all');
    this.sizeFilter.set('all');
    this.surfaceFilter.set('all');
    this.showMobileFilters.set(false);
  }
}