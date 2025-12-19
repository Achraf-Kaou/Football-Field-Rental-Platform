/* // auth-callback.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service'; // Your auth service

@Component({
  selector: 'app-auth-callback',
  template: '<div>Processing authentication...</div>'
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Extract tokens from query parameters
    this.route.queryParams.subscribe(params => {
      const accessToken = params['accessToken'];
      const refreshToken = params['refreshToken'];
      const error = params['error'];

      if (error) {
        console.error('Authentication error:', error);
        this.router.navigate(['/login'], { queryParams: { error: 'auth_failed' } });
        return;
      }

      if (accessToken && refreshToken) {
        // Store tokens (localStorage or your preferred method)
        this.authService.setTokens(accessToken, refreshToken);

        // Redirect to dashboard or home
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
 */