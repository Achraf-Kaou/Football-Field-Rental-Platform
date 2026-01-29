import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ComplexDTO } from '../interfaces/complex.dto';
import { environment } from '../../environments/environment.development';
import { Complex } from '../models/complex.model';
import { HttpCacheService } from './http-cache.service';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ComplexService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private cache = inject(HttpCacheService);

  createComplex(complex: ComplexDTO) {
    console.log(complex);
    return this.http
      .post<ComplexDTO>(`${this.baseUrl}/complex`, complex)
      .pipe(tap(() => this.cache.clearByPrefix(`${this.baseUrl}/complex`)));
  }

  getAllComplexes(page?: number, itemsPerPage?: number, search?: string, status?: string, userId?:number, sortBy?: string) {
    console.log('Fetching complexes with params:', { page, itemsPerPage, search, status, userId, sortBy });
    return this.http.get<Complex[]>(`${this.baseUrl}/complex?page=${page}&limit=${itemsPerPage}&search=${search ? search : ''}&${(status) ? `&status=${status}` : ''}&${(userId) ? `&userId=${userId}` : ''}&${(sortBy) ? `&sortedBy=${sortBy}` : ''}`);
  }

  getComplexCount(userId?:number) {
    return this.http.get<number>(`${this.baseUrl}/complex/count?${(userId) ? `userId=${userId}` : ''}`);
  }

  getComplexById(id: number) {
    return this.http.get<Complex>(`${this.baseUrl}/complex/${id}`);
  }

  updateComplex(id: number |null, complex: ComplexDTO){
    return this.http
      .patch<ComplexDTO>(`${this.baseUrl}/complex/${id}`, complex)
      .pipe(tap(() => this.cache.clearByPrefix(`${this.baseUrl}/complex`)));
  }

  deleteComplex(id: number) {
    return this.http
      .delete(`${this.baseUrl}/complex/${id}`)
      .pipe(tap(() => this.cache.clearByPrefix(`${this.baseUrl}/complex`)));
  }

}
