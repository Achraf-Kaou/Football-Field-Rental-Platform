import { Complex } from "./complex.model";
import { Booking } from "./booking.model";

export type Language = 'fr' | 'en' | 'ar';

export interface FieldModel {
    id: number;
    name: string;
    description: string;
    type: string;
    surface: number;
    price: number;
    images: string[];
    status: string;
    availability: any;
    complexId: number;
    complex?: Complex;
    bookings: Booking[];
    createdAt: Date;
    updatedAt: Date;
}

export interface FieldModelForBooking {
    id: number;
    name: string;
    description: string;
    type: string;
    surface: number;
    price: number;
    images: string[];
    status: string;
    availability: any;
    complexId: number;
    complex?: Complex;
    createdAt: Date;
    updatedAt: Date;
}
