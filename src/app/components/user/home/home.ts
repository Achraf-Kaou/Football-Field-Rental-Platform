import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button';
import { CardComponent } from '../../ui/card/card';
import { InputComponent } from '../../ui/input/input';
import { NavbarMain } from '../../common/navbar-main/navbar-main';
import { FooterMain } from '../../common/footer-main/footer-main';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonComponent, CardComponent, InputComponent, NavbarMain, FooterMain],
  templateUrl: './home.html',
  styles: [`
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fade-in 0.6s ease-out;
    }
  `]
})
export class Home {
  searchLocation = signal('');
  searchDate = signal('');

  featuredFields = signal([
    {
      id: 1,
      name: 'Elite Sports Arena',
      location: 'Downtown, City Center',
      price: '$50',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80'
    },
    {
      id: 2,
      name: 'Green Valley Stadium',
      location: 'North District',
      price: '$45',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80'
    },
    {
      id: 3,
      name: 'Sunset Sports Complex',
      location: 'West Side',
      price: '$40',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'
    }
  ]);
}
