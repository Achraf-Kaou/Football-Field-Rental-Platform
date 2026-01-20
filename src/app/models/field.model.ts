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
    createdAt: Date;
    updatedAt: Date;
}
