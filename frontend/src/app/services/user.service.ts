// src/app/services/user.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

// ==================== Interfaces ====================

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: 'user' | 'owner' | 'admin';
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'user' | 'owner' | 'admin';
}

export interface FindAllUsersDto {
  page?: number;
  limit?: number;
  sortedBy?: string;
  sortedDirection?: 'asc' | 'desc';
  role?: 'user' | 'owner' | 'admin';
  search?: string;
}

export interface SearchUsersDto {
  query?: string;
  page?: number;
  limit?: number;
  excludeUserId?: number;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  googleId?: string;
  facebookId?: string;
  provider?: string;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchUsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== Service ====================

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;

  // ✅ Signals for reactive state
  private usersSignal = signal<User[]>([]);
  private loadingSignal = signal<boolean>(false);

  // ✅ Public readonly signals
  public users = this.usersSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Create a new user
   */
  create(createUserDto: CreateUserDto): Observable<User> {
    this.loadingSignal.set(true);

    return this.http.post<User>(this.API_URL, createUserDto).pipe(
      tap(user => {
        // Add to local users array
        const currentUsers = this.usersSignal();
        this.usersSignal.set([...currentUsers, user]);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Get all users with filters and pagination
   */
  findAll(filters?: FindAllUsersDto): Observable<PaginatedUsers> {
    this.loadingSignal.set(true);

    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.sortedBy) params = params.set('sortedBy', filters.sortedBy);
      if (filters.sortedDirection) params = params.set('sortedDirection', filters.sortedDirection);
      if (filters.role) params = params.set('role', filters.role);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<PaginatedUsers>(this.API_URL, { params }).pipe(
      tap(response => {
        this.usersSignal.set(response.data);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Get user by ID
   */
  findOne(id: number): Observable<User> {
    this.loadingSignal.set(true);

    return this.http.get<User>(`${this.API_URL}/${id}`).pipe(
      catchError(this.handleError),
      tap(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Search users by name or email
   */
  searchUsers(searchDto: SearchUsersDto): Observable<SearchUsersResponse> {
    let params = new HttpParams();

    if (searchDto.query) params = params.set('query', searchDto.query);
    if (searchDto.page) params = params.set('page', searchDto.page.toString());
    if (searchDto.limit) params = params.set('limit', searchDto.limit.toString());
    if (searchDto.excludeUserId) params = params.set('excludeUserId', searchDto.excludeUserId.toString());

    return this.http.get<SearchUsersResponse>(`${this.API_URL}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update user
   */
  update(id: number, updateUserDto: UpdateUserDto): Observable<User> {
    this.loadingSignal.set(true);

    return this.http.patch<User>(`${this.API_URL}/${id}`, updateUserDto).pipe(
      tap(updatedUser => {
        // Update in local users array
        const currentUsers = this.usersSignal();
        const updatedUsers = currentUsers.map(user =>
          user.id === id ? updatedUser : user
        );
        this.usersSignal.set(updatedUsers);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Delete user
   */
  remove(id: number): Observable<void> {
    this.loadingSignal.set(true);

    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        // Remove from local users array
        const currentUsers = this.usersSignal();
        const filteredUsers = currentUsers.filter(user => user.id !== id);
        this.usersSignal.set(filteredUsers);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Clear users from signal
   */
  clearUsers(): void {
    this.usersSignal.set([]);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.message || errorMessage;
    }

    console.error('User Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}