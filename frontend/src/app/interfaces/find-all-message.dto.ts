export interface FindAllMessageDto {
  page?: number;
  limit?: number;
  sortedBy?: 'id' | 'createdAt';
  sortedDirection?: 'asc' | 'desc';
  senderId?: number;
  receiverId?: number;
  status?: 'sent' | 'delivered' | 'read';
}