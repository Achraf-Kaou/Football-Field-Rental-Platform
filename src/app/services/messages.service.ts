import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, forkJoin } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';
import { User } from '../models/user.model';
import { Message } from '../models/message.model';
import { messageDTO } from '../interfaces/message.dto';
import { FindAllMessageDto } from '../interfaces/find-all-message.dto';
import { StartConversationDto } from '../interfaces/start-conversation.dto';

export interface PaginatedMessages {
  data: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  userId: number;
  unreadCount: number;
}

export interface ConversationSummary {
  userId: number;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private readonly API_URL = `${environment.apiUrl}/messages`;

  private messagesSignal = signal<Message[]>([]);
  private unreadCountSignal = signal<number>(0);
  private loadingSignal = signal<boolean>(false);

  public messages = this.messagesSignal.asReadonly();
  public unreadCount = this.unreadCountSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();

  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) {}

  sendMessage(messageDto: messageDTO): Observable<Message> {
    this.loadingSignal.set(true);

    return this.http.post<Message>(this.API_URL, messageDto).pipe(
      tap(message => {
        const currentMessages = this.messagesSignal();
        this.messagesSignal.set([...currentMessages, message]);
        this.messagesSubject.next([...currentMessages, message]);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSignal.set(false))
    );
  }

  startConversation(startConversationDto: StartConversationDto): Observable<Message> {
    this.loadingSignal.set(true);
    return this.http.post<Message>(`${this.API_URL}/start-conversation`, startConversationDto).pipe(
      tap(message => {
        const currentMessages = this.messagesSignal();
        this.messagesSignal.set([...currentMessages, message]);
        this.messagesSubject.next([...currentMessages, message]);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSignal.set(false))
    );
  }

  findAll(filters?: FindAllMessageDto): Observable<PaginatedMessages> {
    this.loadingSignal.set(true);

    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.sortedBy) params = params.set('sortedBy', filters.sortedBy);
      if (filters.sortedDirection) params = params.set('sortedDirection', filters.sortedDirection);
      if (filters.senderId) params = params.set('senderId', filters.senderId.toString());
      if (filters.receiverId) params = params.set('receiverId', filters.receiverId.toString());
      if (filters.status) params = params.set('status', filters.status);
    }
    console.log('Fetching messages with params:', params.toString());

    return this.http.get<PaginatedMessages>(this.API_URL, { params }).pipe(
      tap(response => {
        this.messagesSignal.set(response.data);
        this.messagesSubject.next(response.data);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSignal.set(false))
    );
  }

  findConversation(userId1: number, userId2: number): Observable<Message[]> {
    this.loadingSignal.set(true);

    return this.http.get<Message[]>(`${this.API_URL}/conversation/${userId1}/${userId2}`).pipe(
      tap(messages => {
        this.messagesSignal.set(messages);
        this.messagesSubject.next(messages);
      }),
      catchError(this.handleError),
      tap(() => this.loadingSignal.set(false))
    );
  }

  markAsRead(messageId: number, userId: number): Observable<Message> {
    return this.http.patch<Message>(
      `${this.API_URL}/${messageId}/read`,
      { userId }
    ).pipe(
      tap(updatedMessage => {
        const currentMessages = this.messagesSignal();
        const updatedMessages = currentMessages.map(msg =>
          msg.id === messageId ? updatedMessage : msg
        );
        this.messagesSignal.set(updatedMessages);
        this.messagesSubject.next(updatedMessages);

        if (updatedMessage.receiverId === userId) {
          this.unreadCountSignal.update(count => Math.max(0, count - 1));
        }
      }),
      catchError(this.handleError)
    );
  }

  getUnreadCount(userId: number): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.API_URL}/unread/${userId}`).pipe(
      tap(response => {
        this.unreadCountSignal.set(response.unreadCount);
      }),
      catchError(this.handleError)
    );
  }

  markConversationAsRead(userId: number, otherUserId: number): Observable<void> {
    const currentMessages = this.messagesSignal();
    const unreadMessages = currentMessages.filter(
      msg => msg.senderId === otherUserId &&
             msg.receiverId === userId &&
             msg.status !== 'read'
    );

    const markAsReadObservables = unreadMessages.map(msg =>
      this.markAsRead(msg.id, userId)
    );

    return new Observable(observer => {
      if (markAsReadObservables.length === 0) {
        observer.next();
        observer.complete();
        return;
      }

      let completed = 0;
      markAsReadObservables.forEach(obs => {
        obs.subscribe({
          next: () => {
            completed++;
            if (completed === markAsReadObservables.length) {
              observer.next();
              observer.complete();
            }
          },
          error: err => observer.error(err)
        });
      });
    });
  }

  /**
   * FIXED: Get conversations list with last message and unread count
   * Now fetches messages where user is EITHER sender OR receiver
   */
  getConversationsList(userId: number): Observable<ConversationSummary[]> {
    // Make TWO separate API calls: one for sent messages, one for received
    const sentMessages$ = this.findAll({ 
      senderId: userId, 
      limit: 1000,
      sortedBy: 'createdAt',
    });
    
    const receivedMessages$ = this.findAll({ 
      receiverId: userId,
      limit: 1000,
      sortedBy: 'createdAt', 
    });

    return forkJoin([sentMessages$, receivedMessages$]).pipe(
      map(([sentResponse, receivedResponse]) => {
        console.log('Sent response:', sentResponse);
        console.log('Received response:', receivedResponse);

        // Handle both array and paginated response formats
        const sentMessages = Array.isArray(sentResponse) ? sentResponse : (sentResponse.data || []);
        const receivedMessages = Array.isArray(receivedResponse) ? receivedResponse : (receivedResponse.data || []);

        console.log('Sent messages:', sentMessages);
        console.log('Received messages:', receivedMessages);

        // Combine all messages
        const allMessages = [...sentMessages, ...receivedMessages];
        
        if (allMessages.length === 0) {
          console.log('No messages found for user:', userId);
          return [];
        }

        // Remove duplicates based on message ID
        const uniqueMessages = Array.from(
          new Map(allMessages.map(msg => [msg.id, msg])).values()
        );

        console.log('Unique messages count:', uniqueMessages.length);

        // Sort by date descending
        uniqueMessages.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const conversations = new Map<number, ConversationSummary>();

        uniqueMessages.forEach(message => {
          // Determine the other user in the conversation
          const otherUserId = message.senderId === userId
            ? message.receiverId
            : message.senderId;

          const otherUser = message.senderId === userId 
            ? message.receiver 
            : message.sender;

          // Skip if other user data is missing
          if (!otherUser) {
            console.warn('Missing user data for message:', message.id);
            return;
          }

          const existing = conversations.get(otherUserId);

          // Keep only the most recent message for each conversation
          if (!existing || new Date(message.createdAt) > new Date(existing.lastMessage.createdAt)) {
            conversations.set(otherUserId, {
              userId: otherUserId,
              user: otherUser,
              lastMessage: message,
              unreadCount: 0 // Will calculate below
            });
          }
        });

        // Calculate unread counts
        uniqueMessages.forEach(message => {
          if (message.receiverId === userId && message.status !== 'read') {
            const conv = conversations.get(message.senderId);
            if (conv) {
              conv.unreadCount++;
            }
          }
        });

        console.log('Conversations found:', conversations.size);

        // Convert to array and sort by last message time
        return Array.from(conversations.values())
          .sort((a, b) =>
            new Date(b.lastMessage.createdAt).getTime() -
            new Date(a.lastMessage.createdAt).getTime()
          );
      }),
      catchError(error => {
        console.error('Error loading conversations:', error);
        return throwError(() => error);
      })
    );
  }

  clearMessages(): void {
    this.messagesSignal.set([]);
    this.messagesSubject.next([]);
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.message || errorMessage;
    }

    console.error('Message Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}