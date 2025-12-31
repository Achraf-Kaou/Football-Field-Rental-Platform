import { Component, inject, signal } from '@angular/core';
import { form, Field, required, email, minLength, maxLength } from '@angular/forms/signals';
import { NavbarMain } from '../common/navbar-main/navbar-main';
import { AuthService } from '../../services/auth.service';
import { LoginDto } from '../../interfaces/login.dto';
import { RegisterDto } from '../../interfaces/register.dto';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [NavbarMain, Field],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  mode = signal<'login' | 'signup'>('login');
  oauthLoading = signal(false);
  errorMessage = signal<string>('');

  loginModel = signal<LoginDto>({
    email: '',
    password: ''
  });
  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required' })
    email(schemaPath.email, { message: 'Email is invalid' })
    required(schemaPath.password, { message: 'Password is required' })
  });

  registerModel = signal<RegisterDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  registerForm = form(this.registerModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required' })
    email(schemaPath.email, { message: 'Email is invalid' })
    required(schemaPath.password, { message: 'Password is required' })
    required(schemaPath.firstName, { message: 'First name is required' })
    required(schemaPath.lastName, { message: 'Last name is required' })
    required(schemaPath.phone, { message: 'Phone is required' })
    minLength(schemaPath.phone, 8, { message: 'phone must be at least 8 characters long' })
    maxLength(schemaPath.phone, 8, { message: 'phone must be at most 8 characters long' })
  });

  async handleGoogleLogin() {
    console.log('Starting Google login...');

    try {
      const result = await this.authService.loginWithGoogle();
      console.log('Login successful:', result);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Google login error details:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      this.errorMessage.set(error.message || 'Authentication failed');
    }
  }


  handleSignup() {
    if (!this.registerForm().valid()) {
      this.errorMessage.set("Invalid form");
      this.toastService.error(this.errorMessage(), 3000);
      return;
    };

    this.authService.register(this.registerModel()).subscribe({
      next: () => {
        this.toastService.storeForRedirect('success', "registered successfully");
        this.router.navigate(['/manager']);
      },
      error: (error) => {
        this.errorMessage.set("Registration failed");
        this.toastService.error("Registration failed", 3000);
      }
    })
  }

  handleLogin() {
    if (!this.loginForm().valid()) {
      this.errorMessage.set("Invalid form");
      this.toastService.error(this.errorMessage(), 3000);
      return;
    };

    this.authService.login(this.loginModel()).subscribe({
      next: () => {
        this.toastService.storeForRedirect('success', "loggedIn successfully");
        this.router.navigate(['/manager']);
      },
      error: (error) => {
        this.errorMessage.set("Login failed");
        this.toastService.error("Login failed", 3000);
      }
    })
  }

  switchMode(mode: 'login' | 'signup') {
    this.mode.set(mode)
  }

}
