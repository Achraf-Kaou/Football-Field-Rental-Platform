export interface BookingDTO {
    userId: number;
    fieldId: number;
    startAt: string; // ISO date string
    endAt: string;   // ISO date string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}