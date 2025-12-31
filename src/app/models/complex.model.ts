import { Field } from "./field.model";

export interface Complex {
    id: number;
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    images: string[];
    tags: string[];
    fields: Field[];
    openAt: string;
    closeAt: string;
}