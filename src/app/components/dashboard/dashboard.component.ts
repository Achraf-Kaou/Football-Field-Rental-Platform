import { Component, inject, OnInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.toastService.checkStoredToast();
  }
}
