import { User } from './user.model';

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
}