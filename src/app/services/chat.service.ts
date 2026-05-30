import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp?: Date; // Make optional - don't send to backend
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly LOCAL_API_URL = 'http://localhost:3000/chat';
  private readonly OPENAI_API_KEY = '[OPENAI_KEY_REMOVED]_l0zZWXxxHiqVJsqyNR4SmYd5EPi3yBlKbF6VQp3F7YLWhcZ4cf1JUqhwFFUA'; // Replace with your key

  constructor(private http: HttpClient) {}

  /**
   * Send message to OpenAI and get response
   */
  sendToOpenAI(message: string, language: string = 'en'): Observable<string> {
    const systemPrompts = {
      en: 'You are a helpful and friendly chatbot assistant. Answer questions concisely and clearly in English.',
      fr: 'Vous êtes un assistant chatbot utile et amical. Répondez aux questions de manière concise et claire en français.',
      ar: 'أنت مساعد chatbot مفيد وودي. أجب على الأسئلة بإيجاز ووضوح باللغة العربية.'
    };

    const payload = {
      model: 'gpt-3.5-turbo', // Use gpt-3.5-turbo (cheaper than gpt-4)
      messages: [
        {
          role: 'system',
          content: systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
      top_p: 0.9
    };

    return this.http.post<any>(this.OPENAI_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => {
        console.log('[OpenAI Response]:', response);
      }),
      catchError(error => {
        console.error('[OpenAI API Error]:', error);
        return this.handleOpenAIError(error);
      })
    );
  }

  /**
   * Save chat history to local backend (without timestamp)
   */
  saveChatHistory(message: Message): Observable<any> {
    // Remove timestamp before sending to backend
    const messageToSave = {
      text: message.text,
      sender: message.sender,
      id: message.id
      // DO NOT include timestamp
    };

    return this.http.post(`${this.LOCAL_API_URL}/history`, messageToSave).pipe(
      tap(response => {
        console.log('[Chat History Saved]:', response);
      }),
      catchError(error => {
        console.error('[Error saving to database]:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Get chat history from backend
   */
  getChatHistory(): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.LOCAL_API_URL}/history`).pipe(
      tap(messages => {
        console.log('[Chat History Retrieved]:', messages);
      }),
      catchError(error => {
        console.error('[Error retrieving chat history]:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Clear chat history
   */
  clearChatHistory(): Observable<any> {
    return this.http.delete(`${this.LOCAL_API_URL}/history`).pipe(
      tap(response => {
        console.log('[Chat History Cleared]:', response);
      }),
      catchError(error => {
        console.error('[Error clearing chat history]:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Handle OpenAI specific errors
   */
  private handleOpenAIError(error: HttpErrorResponse) {
    let errorMessage = 'Failed to get response from OpenAI';

    if (error.status === 400) {
      errorMessage = 'Bad request: Check your OpenAI API key and request format';
      console.error('[API Key Issue] Verify your OPENAI_API_KEY is correct');
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized: Invalid OpenAI API key';
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded: Please wait before sending another message';
    } else if (error.status === 500) {
      errorMessage = 'OpenAI server error: Please try again later';
    } else if (error.error?.error?.message) {
      errorMessage = error.error.error.message;
    }

    console.error('[OpenAI Error Details]:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error
    });

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handle general HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Make sure backend is running on localhost:3000';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Bad request';
    } else if (error.status === 404) {
      errorMessage = 'Resource not found';
    } else if (error.status === 500) {
      errorMessage = 'Server error: Please try again later';
    }

    console.error('[HTTP Error]:', {
      status: error.status,
      statusText: error.statusText,
      message: errorMessage,
      error: error.error
    });

    return throwError(() => new Error(errorMessage));
  }
}