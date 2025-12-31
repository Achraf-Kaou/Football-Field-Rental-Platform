import { Component, inject, OnInit } from '@angular/core';
import { ToastService } from '../../../services/toast.service';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [ManagerLayout],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private toastService = inject(ToastService);
  private router = inject(Router);

  ngOnInit(): void {
    this.toastService.checkStoredToast();
  }

  navigateToAddComplex() {
    console.log('button clicked')
    this.router.navigate(['manager', 'complex', 'new']);
  }
}
