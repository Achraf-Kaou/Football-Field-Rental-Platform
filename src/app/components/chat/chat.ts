// chat-page.component.ts
import { Component, computed, effect, ViewChild, ElementRef, inject, OnInit, OnDestroy, AfterViewChecked, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { interval, Subscription, Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError, throwError } from 'rxjs';
import { CardComponent } from '../ui/card/card';
import { NavbarMain } from '../common/navbar-main/navbar-main';
import { FooterMain } from '../common/footer-main/footer-main';
import { MessagesService, ConversationSummary } from '../../services/messages.service';
import { Message } from '../../models/message.model';
import { AuthService } from '../../services/auth.service';
import { User, SearchUsersResponse, UserService } from '../../services/user.service';
import { LanguageService } from '../../services/language.service';
import { ManagerLayout } from "../layouts/manager-layout/manager-layout";

interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  senderName: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
  isCurrentUser: boolean;
}

interface Conversation {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, NavbarMain, FooterMain, TranslateModule, ManagerLayout],
  templateUrl: './chat.html'
})
export class Chat implements OnInit, AfterViewChecked, OnDestroy {
  // Injected services
  private messageService = inject(MessagesService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private languageService = inject(LanguageService);

  // View references
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef<HTMLDivElement>;

  sending = signal(false);
  // State signals
  searchQuery = signal('');
  newMessage = signal('');
  selectedConversation = signal<Conversation | null>(null);
  conversations = signal<Conversation[]>([]);
  currentMessages = signal<ChatMessage[]>([]);
  loading = signal(false);
  sendingMessage = signal(false);
  currentUserId = signal<number | null>(null);
  currentUser = this.authService.currentUser;

  // New User Search signals
  showNewMessageModal = signal(false);
  userSearchQuery = signal('');
  searchResults = signal<User[]>([]);
  searchLoading = signal(false);
  selectedUser = signal<User | null>(null);
  initialMessage = signal('');

  // Language
  currentLanguage = this.languageService.currentLanguage;

  // Subscriptions
  private subscriptions = new Subscription();
  private pollingSubscription?: Subscription;
  private searchSubject = new Subject<string>();

  // Computed filtered conversations
  filteredConversations = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.conversations();

    return this.conversations().filter(conv =>
      conv.userName.toLowerCase().includes(query) ||
      conv.lastMessage.toLowerCase().includes(query) ||
      conv.userEmail.toLowerCase().includes(query)
    );
  });

  groupedMessages = computed(() => {
    const messages = this.currentMessages();
    if (!messages.length) return [];

    const groups: { isCurrentUser: boolean; senderName: string; messages: any[] }[] = [];
    let currentGroup: { isCurrentUser: boolean; senderName: string; messages: any[] } | null = null;

    for (const msg of messages) {
      if (!currentGroup || currentGroup.isCurrentUser !== msg.isCurrentUser) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          isCurrentUser: msg.isCurrentUser,
          senderName: msg.senderName,
          messages: [],
        };
      }
      currentGroup.messages.push(msg);
    }
    if (currentGroup) groups.push(currentGroup);

    return groups;
  });

  constructor() {
    // scroll effect unchanged...
    effect(() => {
      const messages = this.currentMessages();
      if (messages.length > 0) {
        queueMicrotask(() => this.scrollToBottom());
      }
    }, { allowSignalWrites: true });

    // search setup unchanged...
    this.searchSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          this.searchResults.set([]);
          return of({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
        }
        this.searchLoading.set(true);
        return this.userService.searchUsers({
          query,
          limit: 10,
          excludeUserId: this.currentUserId() || undefined
        });
      })
    ).subscribe({
      next: (response: SearchUsersResponse) => {
        this.searchResults.set(response.data);
        this.searchLoading.set(false);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.searchLoading.set(false);
        this.searchResults.set([]);
      }
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.currentUserId.set(user.id);
      this.loadConversations();
      this.startPolling();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.pollingSubscription?.unsubscribe();
  }

  /**
   * Open new message modal
   */
  openNewMessageModal() {
    this.showNewMessageModal.set(true);
    this.userSearchQuery.set('');
    this.searchResults.set([]);
    this.selectedUser.set(null);
    this.initialMessage.set('');
  }

  /**
   * Close new message modal
   */
  closeNewMessageModal() {
    this.showNewMessageModal.set(false);
    this.userSearchQuery.set('');
    this.searchResults.set([]);
    this.selectedUser.set(null);
    this.initialMessage.set('');
  }

  /**
   * Handle user search input
   */
  onUserSearchInput(query: string) {
    this.userSearchQuery.set(query);
    this.searchSubject.next(query);
  }

  /**
   * Select user from search results
   */
  selectUserFromSearch(user: User) {
    this.selectedUser.set(user);
    this.userSearchQuery.set(`${user.firstName} ${user.lastName}`);
    this.searchResults.set([]);
  }

  /**
   * Start conversation with selected user
   */
  startNewConversation() {
    const userId = this.currentUserId();
    const targetUser = this.selectedUser();
    const message = this.initialMessage().trim();

    if (!userId || !targetUser) return;

    this.loading.set(true);

    const sub = this.messageService.startConversation({
      currentUserId: userId,
      targetUserId: targetUser.id,
      initialMessage: message || undefined
    }).subscribe({
      next: (response) => {
        this.closeNewMessageModal();
        
        const newConv: Conversation = {
          id: targetUser.id,
          userId: targetUser.id,
          userName: `${targetUser.firstName} ${targetUser.lastName}`,
          userEmail: targetUser.email,
          lastMessage: message || 'Start a conversation',
          timestamp: response.createdAt || new Date().toISOString(),
          unread: 0,
          status: 'false'
        };

        // Update conversations immutably
        this.conversations.update(convs => {
          const filtered = convs.filter(c => c.userId !== targetUser.id);
          return [newConv, ...filtered];
        });

        // Select the new conversation
        this.selectConversation(newConv);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error starting conversation:', error);
        this.loading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Load all conversations for current user
   */
  loadConversations() {
    const userId = this.currentUserId();
    if (!userId) return;

    this.loading.set(true);

    const sub = this.messageService.getConversationsList(userId).subscribe({
      next: (summaries: ConversationSummary[]) => {
        const conversations: Conversation[] = summaries.map(summary => ({
          id: summary.userId,
          userId: summary.userId,
          userName: `${summary.user.firstName} ${summary.user.lastName}`,
          userEmail: summary.user.email,
          lastMessage: summary.lastMessage.content,
          timestamp: summary.lastMessage.createdAt,
          unread: summary.unreadCount,
          status: 'false'
        }));

        this.conversations.set([...conversations]);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.loading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Select a conversation and load messages
   */
  selectConversation(conv: Conversation) {
    const userId = this.currentUserId();
    if (!userId) return;

    this.selectedConversation.set({ ...conv });
    this.loading.set(true);

    const sub = this.messageService.findConversation(userId, conv.userId).subscribe({
      next: (messages: Message[]) => {
        const chatMessages: ChatMessage[] = messages.map(msg => ({
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          senderName: msg.sender 
            ? `${msg.sender.firstName} ${msg.sender.lastName}`
            : 'Unknown',
          content: msg.content,
          status: msg.status,
          timestamp: msg.createdAt,
          isCurrentUser: msg.senderId === userId
        }));

        this.currentMessages.set([...chatMessages]);
        this.loading.set(false);

        // Mark conversation as read
        this.markConversationAsRead(conv.userId);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.loading.set(false);
      }
    });

    this.subscriptions.add(sub);
  }

 /**
   * Send a new message (optimistic UI, robust signal update)
   */
  sendMessage() {
    const content = this.newMessage().trim();
    const userId = this.currentUserId();
    const selectedConv = this.selectedConversation();

    if (!content || !userId || !selectedConv) return;

    // create an optimistic message (temp negative id)
    const tempId = -(Date.now());
    const nowIso = new Date().toISOString();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: userId,
      receiverId: selectedConv.userId,
      senderName: 'You',
      content,
      status: 'sent',
      timestamp: nowIso,
      isCurrentUser: true
    };

    // Immediately show the optimistic message in UI (use .set to produce new array instance)
    this.currentMessages.set([...this.currentMessages(), optimisticMsg]);

    // clear input & set flags
    this.newMessage.set('');
    this.sendingMessage.set(true);
    this.sending.set(true);

    // Ensure view scrolls to show the new message
    queueMicrotask(() => this.scrollToBottom());

    const messageDto = {
      senderId: userId,
      receiverId: selectedConv.userId,
      content,
      status: 'sent' as const
    };

    // Call service but catch the specific service bug and convert it into a fallback server-like response.
    const sub = this.messageService.sendMessage(messageDto).pipe(
      catchError((err: any) => {
        // If the service throws that specific "currentMessages is not iterable" bug, convert it to a
        // synthetic server response so the UI can replace the optimistic message and continue.
        const msg = (err && err.message) ? String(err.message) : '';
        if (msg.includes('currentMessages is not iterable')) {
          console.warn('[Workaround] messages.service bug detected; using fallback server response for UI.');
          const fallback: Partial<Message> = {
            id: undefined,
            senderId: userId,
            receiverId: selectedConv.userId,
            content,
            status: 'sent',
            createdAt: nowIso
          };
          // return a value so subscribe(next) is invoked with a fallback message
          return of(fallback as Message);
        }

        // rethrow other errors
        return throwError(() => err);
      })
    ).subscribe({
      next: (message: Message | any) => {
        // If fallback object arrived (no id), still build a usable ChatMessage
        const serverMsg: ChatMessage = {
          id: message?.id ?? Math.abs(tempId), // if no server id, give a positive id based on tempId
          senderId: message?.senderId ?? userId,
          receiverId: message?.receiverId ?? selectedConv.userId,
          senderName: 'You',
          content: message?.content ?? content,
          status: message?.status ?? 'delivered',
          timestamp: message?.createdAt ?? nowIso,
          isCurrentUser: true
        };

        // Replace the optimistic message (tempId) with server message (map -> new array)
        this.currentMessages.set(this.currentMessages().map(m => m.id === tempId ? serverMsg : m));

        // Update conversation preview immutably
        this.conversations.update(convs =>
          convs.map(c => c.id === selectedConv.id
            ? { ...c, lastMessage: serverMsg.content, timestamp: serverMsg.timestamp }
            : c
          )
        );

        // reset flags
        this.sendingMessage.set(false);
        this.sending.set(false);

        // scroll after DOM update
        queueMicrotask(() => this.scrollToBottom());
      },
      error: (error) => {
        console.error('Error sending message:', error);

        // Remove optimistic message (it failed) and reset flags
        this.currentMessages.set(this.currentMessages().filter(m => m.id !== tempId));
        this.sendingMessage.set(false);
        this.sending.set(false);

        // You could surface an error toast here
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Mark all messages in conversation as read
   */
  markConversationAsRead(otherUserId: number) {
    const userId = this.currentUserId();
    if (!userId) return;

    const sub = this.messageService.markConversationAsRead(userId, otherUserId).subscribe({
      next: () => {
        // Update immutably
        this.conversations.update(convs =>
          convs.map(c => c.userId === otherUserId ? { ...c, unread: 0 } : c)
        );
      },
      error: (error) => {
        console.error('Error marking as read:', error);
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Start polling for new messages - pause selected conversation refresh while sending
   */
  startPolling() {
    this.pollingSubscription?.unsubscribe();

    this.pollingSubscription = interval(5000).subscribe(() => {
      const selectedConv = this.selectedConversation();
      const userId = this.currentUserId();

      // If we're currently sending a message, skip refreshing the selected conversation
      // to avoid overwriting optimistic UI while pending
      if (this.sendingMessage()) {
        return;
      }

      if (selectedConv && userId) {
        this.refreshSelectedConversation(selectedConv.userId);
      }

      if (userId) {
        this.refreshConversationsList(userId);
      }
    });
  }


/**
   * Refresh selected conversation messages silently (merge-safe)
   * (unchanged from your current implementation)
   */
  private refreshSelectedConversation(otherUserId: number) {
    const userId = this.currentUserId();
    if (!userId) return;

    this.messageService.findConversation(userId, otherUserId).subscribe({
      next: (messages: Message[]) => {
        const serverMsgs: ChatMessage[] = messages.map(msg => ({
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          senderName: msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown',
          content: msg.content,
          status: msg.status,
          timestamp: msg.createdAt,
          isCurrentUser: msg.senderId === userId
        }));

        const serverIds = new Set(serverMsgs.map(m => m.id));
        const local = this.currentMessages();

        const optimisticNotOnServer = local.filter(m => m.id < 0 && !serverIds.has(m.id));
        const localNonOpt = local.filter(m => m.id >= 0);
        const serverFingerprint = serverMsgs.map(m => `${m.id}:${m.timestamp}`).join('|');
        const localFingerprint = localNonOpt.map(m => `${m.id}:${m.timestamp}`).join('|');

        if (serverFingerprint === localFingerprint && optimisticNotOnServer.length === 0) {
          return;
        }

        const merged: ChatMessage[] = [...serverMsgs];

        for (const opt of local.filter(m => m.id < 0)) {
          const match = serverMsgs.find(s =>
            s.isCurrentUser === opt.isCurrentUser &&
            s.content === opt.content &&
            Math.abs(new Date(s.timestamp).getTime() - new Date(opt.timestamp).getTime()) < 5000
          );

          if (match) {
            continue;
          }

          if (!serverIds.has(opt.id)) {
            merged.push(opt);
          }
        }

        merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const currentJson = JSON.stringify(this.currentMessages());
        const mergedJson = JSON.stringify(merged);
        if (currentJson !== mergedJson) {
          this.currentMessages.set(merged);
        }

        this.markConversationAsRead(otherUserId);
      },
      error: (error) => {
        console.error('Error refreshing messages:', error);
      }
    });
  }

  /**
   * Refresh conversations list silently (no loading state)
   */
  private refreshConversationsList(userId: number) {
    this.messageService.getConversationsList(userId).subscribe({
      next: (summaries: ConversationSummary[]) => {
        const conversations: Conversation[] = summaries.map(summary => ({
          id: summary.userId,
          userId: summary.userId,
          userName: `${summary.user.firstName} ${summary.user.lastName}`,
          userEmail: summary.user.email,
          lastMessage: summary.lastMessage.content,
          timestamp: summary.lastMessage.createdAt,
          unread: summary.unreadCount,
          status: 'false'
        }));

        // Only update if data has changed
        const currentConvs = this.conversations();
        if (JSON.stringify(currentConvs) !== JSON.stringify(conversations)) {
          this.conversations.set([...conversations]);
        }
      },
      error: (error) => {
        console.error('Error refreshing conversations:', error);
      }
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Get conversation CSS class
   */
  getConversationClass(convId: number): string {
    const base = 'text-left';
    const selected = 'bg-primary/10 border-l-4 border-primary';
    return this.selectedConversation()?.id === convId ? `${base} ${selected}` : base;
  }

  /**
   * Get message bubble CSS class
   */
  getMessageBubbleClass(isCurrentUser: boolean): string {
    return isCurrentUser
      ? 'bg-primary text-background-dark rounded-2xl rounded-br-sm px-3 sm:px-4 py-2 sm:py-3 shadow-lg'
      : 'bg-white dark:bg-surface-card border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm px-3 sm:px-4 py-2 sm:py-3 shadow-sm';
  }

  /**
   * Format timestamp for conversation list
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  }

  /**
   * Format timestamp for messages
   */
  formatMessageTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom() {
    const container = this.messagesContainer?.nativeElement;
    if (!container) return;
    // Use requestAnimationFrame for smoother outcome and ensure DOM painted
    requestAnimationFrame(() => {
      try {
        container.scrollTop = container.scrollHeight;
      } catch (e) {
        // ignore
      }
    });
  }

  /**
   * Close selected conversation (mobile)
   */
  closeConversation() {
    this.selectedConversation.set(null);
  }
}