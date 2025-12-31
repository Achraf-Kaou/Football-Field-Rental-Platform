import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ComplexDTO } from '../interfaces/complex.dto';
import { environment } from '../../environments/environment.development';
import { Complex } from '../models/complex.model';

@Injectable({
  providedIn: 'root',
})
export class ComplexService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  createComplex(complex: ComplexDTO) {
    console.log(complex);
    return this.http.post<ComplexDTO>(`${this.baseUrl}/complex`, complex);
  }

  getAllComplexes(page?: number, itemsPerPage?: number, search?: string, status?: string, sortBy?: string) {
    console.log(status);
    console.log(status == 'true' ? `&status=${true}` : status == 'false' ? `&status=${false}` : '');

    return this.http.get<Complex[]>(`${this.baseUrl}/complex?page=${page}&limit=${itemsPerPage}&search=${search ? search : ''}&${(status) ? `&status=${status}` : ''}&${(sortBy) ? `&sort=${sortBy}` : ''}`);
  }

  getComplexCount() {
    return this.http.get<number>(`${this.baseUrl}/complex/count`);
  }

}
