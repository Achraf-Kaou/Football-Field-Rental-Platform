import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  createBooking(bookingData: any) {
    return this.http.post<any>(`${this.baseUrl}/bookings`, bookingData);
  }

  getBookingsByComplexId(fieldId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/bookings?fieldId=${fieldId}`);
  }

  getBookingById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/bookings/${id}`);
  }

  updateBooking(id: number, bookingData: any) {
    return this.http.patch<any>(`${this.baseUrl}/bookings/${id}`, bookingData);
  }

  deleteBooking(id: number) {
    return this.http.delete(`${this.baseUrl}/bookings/${id}`);
  }

}
