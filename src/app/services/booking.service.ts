import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { BookingDTO } from '../interfaces/booking.dto';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  createBooking(bookingData: BookingDTO) {
    return this.http.post<any>(`${this.baseUrl}/bookings`, bookingData);
  }
  
  getBookingById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/bookings/${id}`);
  }

  getBookingsByUserId(userId: number | undefined){
    return this.http.get<any>(`${this.baseUrl}/bookings?userId=${userId}`);
  }

  getBookingsByFieldId(fieldId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/bookings?fieldId=${fieldId}`);
  }

  getBookingsByComplexId(complexId: number){
    return this.http.get<any[]>(`${this.baseUrl}/bookings?fieldId=${complexId}`);
  }

  updateBooking(id: number, bookingData: any) {
    return this.http.patch<any>(`${this.baseUrl}/bookings/${id}`, bookingData);
  }

  cancelBooking(id: number){
    return this.http.patch<any>(`${this.baseUrl}/bookings/${id}/cancel`, {});
  }

  deleteBooking(id: number) {
    return this.http.delete(`${this.baseUrl}/bookings/${id}`);
  }

}
