export interface FieldDTO {
    name: string;
    description: string;
    type: string;
    surface: number;
    price: number;
    status: string;
    complexId: number;
    images?: string[];
    availability?: any;
}