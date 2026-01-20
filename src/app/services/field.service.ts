import { inject, Injectable } from '@angular/core';
import { FieldDTO } from '../interfaces/field.dto';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { FieldModel } from '../models/field.model';

@Injectable({
  providedIn: 'root',
})
export class FieldService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  createField(fieldDTO: FieldDTO) {
    return this.http.post<FieldDTO>(`${this.baseUrl}/fields`, fieldDTO);
  }

  getAllFields(page?: number, limit?: number, search?: string, sortedBy?: string, sortedDirection?: string, complexId?: number, status?: string, type?: string) {
    console.log(complexId)
    return this.http.get<FieldModel[]>(`${this.baseUrl}/fields?${(page) ? `page=${page}` : ''}&${(limit) ? `limit=${limit}` : ''}&${(search) ? `&search=${search}` : ''}&${(sortedBy) ? `&sortBy=${sortedBy}` : ''}&${(sortedDirection) ? `&sortDirection=${sortedDirection}` : ''}&${(complexId) ? `&complexId=${complexId}` : ''}&${(status) ? `&status=${status}` : ''}&${(type) ? `&type=${type}` : ''}`);
  }

  getFieldById(id: number) {
    return this.http.get<FieldModel>(`${this.baseUrl}/fields/${id}`);
  }

  updateField(id: number, fieldDTO: Partial<FieldModel>) {
    return this.http.patch<FieldDTO>(`${this.baseUrl}/fields/${id}`, fieldDTO);
  }

  deleteField(id: number) {
    return this.http.delete(`${this.baseUrl}/fields/${id}`);
  }
  
  countAll(id?: number) {
    return this.http.get<number>(`${this.baseUrl}/fields/count?${(id) ? `complexId=${id}` : ''}`);
  }
}
