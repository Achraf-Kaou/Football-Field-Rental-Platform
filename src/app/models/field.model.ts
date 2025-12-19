export type Language = 'fr' | 'en' | 'ar';

export interface Field {
    id: string;
    name: string;
    location: string;
    price: number;
    image: string;
    available: boolean;
}
