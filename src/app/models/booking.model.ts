import { FieldModel } from "./field.model";

export interface Booking {
    id: number;
    userId: number;
    fieldId: number;
    startAt: string;
    endAt: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    field: FieldModel
}