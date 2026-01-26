import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  templateUrl: './unauthorized.html',
  styleUrls: ['./unauthorized.css']
})
export class Unauthorized {
  constructor(private router: Router) { }

  goToHome(): void {
    this.router.navigate(['']);
  }
}