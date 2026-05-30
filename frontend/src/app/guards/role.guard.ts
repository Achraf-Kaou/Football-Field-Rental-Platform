import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    // Not authenticated -> send to main
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['']);
    }

    // Get allowed roles from route data (may be string or array)
    let allowedRoles = route.data?.['roles'];
    if (!allowedRoles) {
      // If no roles specified, allow access
      return true;
    }
    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles];
    }
    // Normalize to strings
    const allowed = (allowedRoles as any[]).map((r) => String(r));

    // Get user's role(s). AuthService might return a string or an array.
    const userRoleOrRoles = this.authService.getUserRole();
    console.log('User Role(s):', userRoleOrRoles, 'Allowed Roles:', allowed);
    const userRoles = Array.isArray(userRoleOrRoles)
      ? (userRoleOrRoles as any[]).map((r) => String(r))
      : [String(userRoleOrRoles)];

    // If any of the user's roles is allowed, permit access
    const isAllowed = userRoles.some((ur) => allowed.includes(ur));

    if (isAllowed) {
      return true;
    }

    // Role not allowed -> go to unauthorized page
    return this.router.createUrlTree(['/unauthorized']);
  }
}