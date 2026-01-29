import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../ui/button/button';
import { CardComponent } from '../../ui/card/card';
import { FooterMain } from '../footer-main/footer-main';
import { NavbarMain } from '../navbar-main/navbar-main';
import { AuthService } from '../../../services/auth.service';
import { UserService, UpdateUserDto } from '../../../services/user.service';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';
import { ManagerLayout } from "../../layouts/manager-layout/manager-layout";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, CardComponent, NavbarMain, FooterMain, ManagerLayout],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  profileForm!: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);
  currentUser = this.authService.currentUser;

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserProfile();
  }

  /**
   * Initialize the form with validators
   */
  private initializeForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{8,}$/)]],
    });
  }

  /**
   * Load user profile data
   */
  private loadUserProfile(): void {
    this.isLoading.set(true);
    const user = this.currentUser();
    if (!user) {
      this.toastService.error('User not found', 3000);
      return;
    }
    this.userService.findOne(user.id).subscribe({
      next: (user) => {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || ''
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.toastService.error('Failed to load profile', 3000);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Save profile changes
   */
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      this.toastService.error('Please fill in all required fields correctly', 3000);
      return;
    }

    const user = this.currentUser();
    if (!user) {
      this.toastService.error('User not found', 3000);
      return;
    }

    this.isSaving.set(true);
    
    const updateData: UpdateUserDto = {
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      email: this.profileForm.value.email,
      phone: this.profileForm.value.phone
    };

    this.userService.update(user.id, updateData).subscribe({
      next: (updatedUser) => {
        // Update the auth service with the new user data
        this.authService.getProfile().subscribe({
          next: () => {
            this.toastService.success('Profile updated successfully', 3000);
          },
          error: (error) => {
            console.error('Error refreshing profile:', error);
            // Still show success since the update succeeded
            this.toastService.success('Profile updated successfully', 3000);
          }
        });
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.toastService.error('Failed to update profile', 3000);
        this.isSaving.set(false);
      }
    });
  }

  /**
   * Cancel and go back
   */
  onCancel(): void {
    this.router.navigate(['/user']);
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if a field has an error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field?.hasError(errorType) && field?.touched);
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (field?.hasError('minlength')) {
      const minLength = field.getError('minlength').requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }
    
    if (field?.hasError('pattern')) {
      return `${this.getFieldLabel(fieldName)} contains invalid characters`;
    }
    
    return '';
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone number'
    };
    return labels[fieldName] || fieldName;
  }
}
