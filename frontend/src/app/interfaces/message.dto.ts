export interface messageDTO {
  senderId: number;
  receiverId: number;
  content: string;
  status?: 'sent' | 'delivered' | 'read';
}