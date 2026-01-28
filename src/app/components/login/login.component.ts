import { Component, inject, signal, OnInit } from '@angular/core';
import { form, Field, required, email, minLength, maxLength, pattern } from '@angular/forms/signals';
import { NavbarMain } from '../common/navbar-main/navbar-main';
import { AuthService } from '../../services/auth.service';
import { LoginDto } from '../../interfaces/login.dto';
import { RegisterDto } from '../../interfaces/register.dto';
import { ToastService } from '../../services/toast.service';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [NavbarMain, Field, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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
    phone: '',
    role: 'USER' // Default role
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
    pattern(schemaPath.phone, /^[0-9]+$/, { message: 'phone must contain only numbers' })
    required(schemaPath.role, { message: 'Role is required' })
  });

  ngOnInit() {
    // Check for query parameters to set initial mode
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'signup' || params['mode'] === 'register') {
        this.mode.set('signup');
      } else if (params['mode'] === 'login') {
        this.mode.set('login');
      }
    });
  }

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
      this.toastService.error(this.errorMessage(), 3000);
    }
  }

  handleSignup() {
    if (!this.registerForm().valid()) {
      this.errorMessage.set("Invalid form");
      this.toastService.error(this.errorMessage(), 3000);
      return;
    }

    this.authService.register(this.registerModel()).subscribe({
      next: () => {
        this.toastService.storeForRedirect('success', "Registered successfully");
        // Navigate based on selected role
        if (this.registerModel().role === 'MANAGER') {
          this.router.navigate(['/manager']);
        } else {
          this.router.navigate(['/user']);
        }
      },
      error: (error) => {
        this.errorMessage.set("Registration failed");
        this.toastService.error("Registration failed", 3000);
      }
    });
  }

  handleLogin() {
    if (!this.loginForm().valid()) {
      this.errorMessage.set("Invalid form");
      this.toastService.error(this.errorMessage(), 3000);
      return;
    }

    this.authService.login(this.loginModel()).subscribe({
      next: (data: any) => {
        this.toastService.storeForRedirect('success', "Logged in successfully");
        console.log(data);
        if (data.user.role === 'MANAGER') {
          this.router.navigate(['/manager']);
        } else {
          this.router.navigate(['/user']);
        }
      },
      error: (error) => {
        this.errorMessage.set("Login failed");
        this.toastService.error("Login failed", 3000);
      }
    });
  }

  switchMode(mode: 'login' | 'signup') {
    this.mode.set(mode);
    // Update URL without reloading
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode },
      queryParamsHandling: 'merge'
    });
  }

  setRole(role: 'USER' | 'MANAGER') {
    this.registerModel.update(model => ({ ...model, role }));
  }
}