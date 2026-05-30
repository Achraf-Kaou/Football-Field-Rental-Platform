export interface ComplexDTO {
    id?: number;
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    images: string[];
    userId: number;
    tags?: string[];
    openAt: string;
    closeAt: string;
}