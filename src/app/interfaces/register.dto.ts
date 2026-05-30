export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'USER' | 'ADMIN' | 'MANAGER';
}