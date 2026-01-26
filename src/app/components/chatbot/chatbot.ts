import { Component, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Translation {
  startConversation: string;
  askAnything: string;
  apiKeyRequired: string;
  setApiKey: string;
  typeMessage: string;
  send: string;
  clearChat: string;
  confirmClear: string;
  rateLimitReached: string;
  retrying: string;
  requests: string;
  errorOccurred: string;
  chatWithUs: string;
  online: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      [class]="'fixed bottom-6 z-50 ' + (isRTL() ? 'left-6' : 'right-6')" 
      [attr.dir]="isRTL() ? 'rtl' : 'ltr'">
      
      <!-- Chat Window -->
      <div 
        [class]="'absolute bottom-20 w-[350px] sm:w-[400px] md:w-[420px] transition-all duration-300 transform ' +
                 (isRTL() ? 'left-0' : 'right-0') + ' ' +
                 (isOpen() ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none')">
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px] sm:h-[600px] max-h-[80vh]">
          
          <!-- Header -->
          <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-4 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-white font-bold text-sm sm:text-base">{{t().chatWithUs}}</h3>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span class="text-white/90 text-xs">{{t().online}}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 sm:gap-2">
              <button
                (click)="toggleLanguage()"
                class="p-2 hover:bg-white/20 rounded-lg transition-colors"
                [title]="'Change Language'">
                <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
                </svg>
              </button>
              <button
                (click)="clearChat()"
                class="p-2 hover:bg-white/20 rounded-lg transition-colors"
                [title]="t().clearChat">
                <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
              <button
                (click)="isOpen.set(false)"
                class="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div #messagesContainer class="flex-1 overflow-y-auto p-4 bg-gray-50">
            @if (messages().length === 0) {
              <div class="text-center py-8 sm:py-12">
                <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                  </svg>
                </div>
                <h4 class="text-base sm:text-lg font-bold text-gray-900 mb-2">{{t().startConversation}}</h4>
                <p class="text-gray-600 text-xs sm:text-sm px-4">{{t().askAnything}}</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (message of messages(); track message.timestamp) {
                  <div [class]="'flex gap-2 ' + (message.role === 'user' ? 'flex-row-reverse' : '')">
                    <div class="flex-shrink-0">
                      @if (message.role === 'user') {
                        <div class="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span class="text-white text-xs sm:text-sm font-bold">U</span>
                        </div>
                      } @else {
                        <div class="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                          <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                          </svg>
                        </div>
                      }
                    </div>
                    <div [class]="'max-w-[75%] px-3 py-2 rounded-2xl ' + 
                                  (message.role === 'user' 
                                    ? 'bg-blue-500 text-white rounded-tr-sm' 
                                    : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm')">
                      <p class="text-xs sm:text-sm whitespace-pre-wrap break-words">{{message.content}}</p>
                    </div>
                  </div>
                }
                
                @if (isLoading()) {
                  <div class="flex gap-2">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                      </svg>
                    </div>
                    <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div class="flex gap-1">
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Error Message -->
          @if (error()) {
            <div class="px-4 py-2 bg-red-50 border-t border-red-100 flex-shrink-0">
              <p class="text-red-600 text-xs">{{error()}}</p>
            </div>
          }

          <!-- Input -->
          <div class="p-3 sm:p-4 bg-white border-t border-gray-200 flex-shrink-0">
            <div class="flex gap-2">
              <input
                #messageInput
                type="text"
                [(ngModel)]="userInput"
                (keypress)="handleKeyPress($event)"
                [placeholder]="t().typeMessage"
                [disabled]="isLoading()"
                class="flex-1 px-3 sm:px-4 py-2 bg-gray-100 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              />
              <button
                (click)="sendMessage()"
                [disabled]="isLoading() || !userInput.trim()"
                class="p-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-full transition-all disabled:cursor-not-allowed flex-shrink-0">
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Button -->
      <button
        (click)="toggleChat()"
        [class]="'group relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ' +
                 (isOpen() ? 'rotate-0' : 'hover:scale-110')">
        @if (unreadCount() > 0 && !isOpen()) {
          <div class="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {{unreadCount()}}
          </div>
        }
        
        <div [class]="'transition-all duration-300 ' + (isOpen() ? 'rotate-90 scale-75' : 'rotate-0')">
          @if (isOpen()) {
            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          } @else {
            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
          }
        </div>

        <!-- Pulse Animation -->
        @if (!isOpen()) {
          <div class="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-20"></div>
        }
      </button>
    </div>
  `,
  styles: [`
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-0.5rem);
      }
    }
    
    .animate-bounce {
      animation: bounce 1s infinite;
    }

    @keyframes ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    
    .animate-ping {
      animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class ChatbotComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  // Replace with your OpenRouter API key
  private readonly OPENROUTER_API_KEY = '[OPENAI_KEY_REMOVED]';
  private readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  messages = signal<Message[]>([]);
  userInput = '';
  isLoading = signal(false);
  isOpen = signal(false);
  error = signal<string>('');
  language = signal<'en' | 'fr' | 'es' | 'ar'>('en');
  requestTimestamps = signal<number[]>([]);
  unreadCount = signal(0);

  private translations: Record<string, Translation> = {
    en: {
      startConversation: 'Start a Conversation',
      askAnything: 'Ask me anything! I\'m here to help.',
      apiKeyRequired: 'API Key Required',
      setApiKey: 'Please set your OpenRouter API key in the component code.',
      typeMessage: 'Type your message...',
      send: 'Send',
      clearChat: 'Clear Chat',
      confirmClear: 'Are you sure you want to clear the chat?',
      rateLimitReached: 'Rate limit reached. Please wait a moment.',
      retrying: 'Retrying in',
      requests: 'Requests',
      errorOccurred: 'An error occurred. Please try again.',
      chatWithUs: 'Chat with us',
      online: 'Online'
    },
    fr: {
      startConversation: 'Démarrer une Conversation',
      askAnything: 'Demandez-moi n\'importe quoi ! Je suis là pour vous aider.',
      apiKeyRequired: 'Clé API Requise',
      setApiKey: 'Veuillez définir votre clé API OpenRouter dans le code du composant.',
      typeMessage: 'Tapez votre message...',
      send: 'Envoyer',
      clearChat: 'Effacer le Chat',
      confirmClear: 'Êtes-vous sûr de vouloir effacer le chat ?',
      rateLimitReached: 'Limite de débit atteinte. Veuillez patienter.',
      retrying: 'Nouvelle tentative dans',
      requests: 'Requêtes',
      errorOccurred: 'Une erreur s\'est produite. Veuillez réessayer.',
      chatWithUs: 'Discutez avec nous',
      online: 'En ligne'
    },
    es: {
      startConversation: 'Iniciar una Conversación',
      askAnything: '¡Pregúntame lo que quieras! Estoy aquí para ayudar.',
      apiKeyRequired: 'Clave API Requerida',
      setApiKey: 'Por favor, establezca su clave API de OpenRouter en el código del componente.',
      typeMessage: 'Escribe tu mensaje...',
      send: 'Enviar',
      clearChat: 'Borrar Chat',
      confirmClear: '¿Estás seguro de que quieres borrar el chat?',
      rateLimitReached: 'Límite de velocidad alcanzado. Por favor espera un momento.',
      retrying: 'Reintentando en',
      requests: 'Solicitudes',
      errorOccurred: 'Ocurrió un error. Por favor, inténtalo de nuevo.',
      chatWithUs: 'Chatea con nosotros',
      online: 'En línea'
    },
    ar: {
      startConversation: 'ابدأ محادثة',
      askAnything: 'اسألني أي شيء! أنا هنا للمساعدة.',
      apiKeyRequired: 'مفتاح API مطلوب',
      setApiKey: 'يرجى تعيين مفتاح OpenRouter API الخاص بك في كود المكون.',
      typeMessage: 'اكتب رسالتك...',
      send: 'إرسال',
      clearChat: 'مسح المحادثة',
      confirmClear: 'هل أنت متأكد أنك تريد مسح المحادثة؟',
      rateLimitReached: 'تم الوصول إلى حد المعدل. يرجى الانتظار قليلاً.',
      retrying: 'إعادة المحاولة في',
      requests: 'الطلبات',
      errorOccurred: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      chatWithUs: 'تحدث معنا',
      online: 'متصل'
    }
  };

  constructor() {
    effect(() => {
      if (this.isOpen() && this.messages().length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
        this.unreadCount.set(0);
      }
    });

    effect(() => {
      if (this.isOpen() && this.messageInput) {
        setTimeout(() => this.messageInput.nativeElement.focus(), 100);
      }
    });
  }

  t = signal<Translation>(this.translations['en']);
  isRTL = signal(false);

  toggleLanguage() {
    const languages: Array<'en' | 'fr' | 'es' | 'ar'> = ['en', 'fr', 'es', 'ar'];
    const currentIndex = languages.indexOf(this.language());
    const nextIndex = (currentIndex + 1) % languages.length;
    const newLang = languages[nextIndex];
    
    this.language.set(newLang);
    this.t.set(this.translations[newLang]);
    this.isRTL.set(newLang === 'ar');
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.unreadCount.set(0);
    }
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestTimestamps().filter(ts => ts > oneMinuteAgo);
    this.requestTimestamps.set(recentRequests);
    return recentRequests.length < this.MAX_REQUESTS_PER_MINUTE;
  }

  recordRequest() {
    this.requestTimestamps.update(timestamps => [...timestamps, Date.now()]);
  }

  async sendMessage() {
    if (!this.userInput.trim() || this.isLoading()) return;

    if (!this.canMakeRequest()) {
      this.error.set(this.t().rateLimitReached);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: this.userInput.trim(),
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMessage]);
    const savedInput = this.userInput;
    this.userInput = '';
    this.isLoading.set(true);
    this.error.set('');

    try {
      this.recordRequest();

      const response = await fetch(this.OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Angular Floating Chatbot'
        },
        body: JSON.stringify({
          model: "liquid/lfm-2.5-1.2b-thinking:free",
          messages: this.messages().map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid response format from API');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date()
      };

      this.messages.update(msgs => [...msgs, assistantMessage]);

      if (!this.isOpen()) {
        this.unreadCount.update(count => count + 1);
      }

    } catch (err: any) {
      console.error('Error:', err);
      this.error.set(this.t().errorOccurred);
      this.userInput = savedInput;
    } finally {
      this.isLoading.set(false);
    }
  }

  clearChat() {
    if (confirm(this.t().confirmClear)) {
      this.messages.set([]);
      this.error.set('');
      this.unreadCount.set(0);
    }
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }
}